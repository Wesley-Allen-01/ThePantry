import { redirect } from "next/navigation";
import { PantryApp, type EquipmentItem, type InventoryItem } from "./pantry-app";
import { createClient } from "../lib/supabase/server";
import type { FoodCategory } from "../lib/pantry";

const categoryEmoji: Record<FoodCategory, string> = {
  Produce: "🥬",
  "Meat & seafood": "🐟",
  "Dairy & eggs": "🥛",
  "Grains & bakery": "🥖",
  Frozen: "🧊",
  Condiments: "🫙",
  "Prepared food": "🍲",
  Other: "📦",
};

export default async function Home() {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!isConfigured) return <PantryApp />;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return <PantryApp dataMode="live" userId={user.id} displayName={displayNameFor(user.email, user.user_metadata?.display_name)} initialItems={[]} initialEquipment={[]} />;
  }

  const [inventoryResult, equipmentResult] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id,name,quantity,unit,category,storage_location,added_at,expiration_date,expiration_source")
      .eq("household_id", membership.household_id)
      .eq("status", "active")
      .order("expiration_date", { ascending: true }),
    supabase
      .from("equipment")
      .select("id,name,kind,capabilities")
      .eq("household_id", membership.household_id)
      .eq("available", true)
      .order("name"),
  ]);

  const inventory: InventoryItem[] = (inventoryResult.data ?? []).map((item) => {
    const category = normalizeCategory(item.category);
    return {
      id: item.id,
      name: item.name,
      emoji: categoryEmoji[category],
      quantity: Number(item.quantity),
      unit: item.unit,
      category,
      location: item.storage_location as InventoryItem["location"],
      addedAt: item.added_at.slice(0, 10),
      expirationDate: item.expiration_date ?? item.added_at.slice(0, 10),
      expirationSource: item.expiration_source as InventoryItem["expirationSource"],
    };
  });

  const equipment: EquipmentItem[] = (equipmentResult.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    capability: item.capabilities?.join(" · ") || "Ready to cook",
    emoji: item.kind === "Appliance" ? "⚡" : item.kind === "Cookware" ? "🍳" : "🥄",
  }));

  return (
    <PantryApp
      initialItems={inventory}
      initialEquipment={equipment}
      dataMode="live"
      householdId={membership.household_id}
      userId={user.id}
      displayName={displayNameFor(user.email, user.user_metadata?.display_name)}
    />
  );
}

function displayNameFor(email?: string, preferred?: string) {
  if (preferred?.trim()) return preferred.trim();
  const name = email?.split("@")[0] || "My";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function normalizeCategory(value: string): FoodCategory {
  const allowed: FoodCategory[] = ["Produce", "Meat & seafood", "Dairy & eggs", "Grains & bakery", "Frozen", "Condiments", "Prepared food", "Other"];
  return allowed.includes(value as FoodCategory) ? value as FoodCategory : "Other";
}
