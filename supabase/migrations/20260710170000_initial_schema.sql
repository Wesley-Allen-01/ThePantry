create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.inventory_items (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 120),
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit text not null default 'item',
  category text not null default 'Other',
  storage_location text not null default 'Fridge' check (storage_location in ('Fridge', 'Freezer', 'Pantry')),
  added_at timestamptz not null default now(),
  expiration_date date,
  expiration_source text not null default 'suggested' check (expiration_source in ('suggested', 'manual')),
  opened_at date,
  status text not null default 'active' check (status in ('active', 'consumed', 'discarded', 'donated')),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 120),
  kind text not null check (kind in ('Appliance', 'Cookware', 'Utensil')),
  capabilities text[] not null default '{}',
  available boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipe_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dietary_restrictions text[] not null default '{}',
  disliked_ingredients text[] not null default '{}',
  default_servings integer not null default 2 check (default_servings between 1 and 20),
  maximum_minutes integer check (maximum_minutes between 5 and 480),
  updated_at timestamptz not null default now()
);

create index inventory_items_household_status_idx on public.inventory_items(household_id, status);
create index inventory_items_expiration_idx on public.inventory_items(household_id, expiration_date) where status = 'active';
create index equipment_household_idx on public.equipment(household_id);
create index household_members_user_idx on public.household_members(user_id);

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = target_household_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.inventory_items enable row level security;
alter table public.equipment enable row level security;
alter table public.recipe_preferences enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Members can read their household"
on public.households for select
using (public.is_household_member(id));

create policy "Owners can update their household"
on public.households for update
using (public.is_household_owner(id))
with check (public.is_household_owner(id));

create policy "Members can read household memberships"
on public.household_members for select
using (public.is_household_member(household_id));

create policy "Owners can add household members"
on public.household_members for insert
with check (public.is_household_owner(household_id));

create policy "Owners can remove household members"
on public.household_members for delete
using (public.is_household_owner(household_id));

create policy "Members can read household inventory"
on public.inventory_items for select
using (public.is_household_member(household_id));

create policy "Members can add household inventory"
on public.inventory_items for insert
with check (public.is_household_member(household_id) and created_by = (select auth.uid()));

create policy "Members can update household inventory"
on public.inventory_items for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "Members can delete household inventory"
on public.inventory_items for delete
using (public.is_household_member(household_id));

create policy "Members can read household equipment"
on public.equipment for select
using (public.is_household_member(household_id));

create policy "Members can add household equipment"
on public.equipment for insert
with check (public.is_household_member(household_id) and created_by = (select auth.uid()));

create policy "Members can update household equipment"
on public.equipment for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "Members can delete household equipment"
on public.equipment for delete
using (public.is_household_member(household_id));

create policy "Users manage their own recipe preferences"
on public.recipe_preferences for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger households_set_updated_at before update on public.households for each row execute function public.set_updated_at();
create trigger inventory_items_set_updated_at before update on public.inventory_items for each row execute function public.set_updated_at();
create trigger equipment_set_updated_at before update on public.equipment for each row execute function public.set_updated_at();
create trigger recipe_preferences_set_updated_at before update on public.recipe_preferences for each row execute function public.set_updated_at();

create or replace function public.prevent_immutable_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by is immutable';
  end if;
  if new.household_id is distinct from old.household_id then
    raise exception 'household_id is immutable';
  end if;
  return new;
end;
$$;

create trigger inventory_items_prevent_immutable_columns before update on public.inventory_items for each row execute function public.prevent_immutable_columns();
create trigger equipment_prevent_immutable_columns before update on public.equipment for each row execute function public.prevent_immutable_columns();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
  preferred_name text;
begin
  preferred_name := coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1));

  insert into public.profiles (id, display_name)
  values (new.id, preferred_name);

  insert into public.households (name, created_by)
  values (left(preferred_name, 70) || '''s kitchen', new.id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  insert into public.recipe_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
