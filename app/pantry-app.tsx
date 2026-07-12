"use client";

import {
  ArrowUpDown,
  Bell,
  Boxes,
  Check,
  ChefHat,
  ChevronRight,
  Clock3,
  CookingPot,
  Flame,
  LayoutDashboard,
  Leaf,
  MapPin,
  PackageOpen,
  Plus,
  Refrigerator,
  Search,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trash2,
  Utensils,
  WandSparkles,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { createClient as createSupabaseClient } from "../lib/supabase/client";
import {
  addDaysIso,
  daysUntil,
  FoodCategory,
  freshnessLabel,
  inferCategory,
  suggestedExpirationDays,
} from "../lib/pantry";
import styles from "./pantry.module.css";

type View = "overview" | "inventory" | "recipes" | "equipment";
type StorageLocation = "Fridge" | "Freezer" | "Pantry";

export type InventoryItem = {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
  location: StorageLocation;
  addedAt: string;
  expirationDate: string;
  expirationSource: "suggested" | "manual";
};

export type EquipmentItem = {
  id: string;
  name: string;
  kind: string;
  capability: string;
  emoji: string;
};

const categories: FoodCategory[] = [
  "Produce",
  "Meat & seafood",
  "Dairy & eggs",
  "Grains & bakery",
  "Frozen",
  "Condiments",
  "Prepared food",
  "Other",
];

const emojiForCategory: Record<FoodCategory, string> = {
  Produce: "🥬",
  "Meat & seafood": "🐟",
  "Dairy & eggs": "🥛",
  "Grains & bakery": "🥖",
  Frozen: "🧊",
  Condiments: "🫙",
  "Prepared food": "🍲",
  Other: "📦",
};

function makeInventory(): InventoryItem[] {
  const today = new Date();
  return [
    {
      id: "spinach",
      name: "Baby spinach",
      emoji: "🥬",
      quantity: 1,
      unit: "bag",
      category: "Produce",
      location: "Fridge",
      addedAt: addDaysIso(today, -4),
      expirationDate: addDaysIso(today, 0),
      expirationSource: "manual",
    },
    {
      id: "salmon",
      name: "Wild salmon",
      emoji: "🐟",
      quantity: 2,
      unit: "fillets",
      category: "Meat & seafood",
      location: "Fridge",
      addedAt: addDaysIso(today, -1),
      expirationDate: addDaysIso(today, 1),
      expirationSource: "suggested",
    },
    {
      id: "yogurt",
      name: "Greek yogurt",
      emoji: "🥣",
      quantity: 2,
      unit: "tubs",
      category: "Dairy & eggs",
      location: "Fridge",
      addedAt: addDaysIso(today, -3),
      expirationDate: addDaysIso(today, 4),
      expirationSource: "manual",
    },
    {
      id: "carrots",
      name: "Rainbow carrots",
      emoji: "🥕",
      quantity: 6,
      unit: "pieces",
      category: "Produce",
      location: "Fridge",
      addedAt: addDaysIso(today, -2),
      expirationDate: addDaysIso(today, 7),
      expirationSource: "suggested",
    },
    {
      id: "eggs",
      name: "Free-range eggs",
      emoji: "🥚",
      quantity: 8,
      unit: "eggs",
      category: "Dairy & eggs",
      location: "Fridge",
      addedAt: addDaysIso(today, -5),
      expirationDate: addDaysIso(today, 12),
      expirationSource: "manual",
    },
    {
      id: "rice",
      name: "Jasmine rice",
      emoji: "🍚",
      quantity: 1,
      unit: "bag",
      category: "Grains & bakery",
      location: "Pantry",
      addedAt: addDaysIso(today, -14),
      expirationDate: addDaysIso(today, 180),
      expirationSource: "manual",
    },
  ];
}

const initialEquipment: EquipmentItem[] = [
  { id: "knife", name: "Chef’s knife", kind: "Utensil", capability: "Chop & slice", emoji: "🔪" },
  { id: "skillet", name: "Cast-iron skillet", kind: "Cookware", capability: "Stovetop & oven", emoji: "🍳" },
  { id: "blender", name: "Countertop blender", kind: "Appliance", capability: "Blend & purée", emoji: "🥤" },
  { id: "air-fryer", name: "Air fryer", kind: "Appliance", capability: "Crisp & roast", emoji: "♨️" },
];

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: PackageOpen },
  { id: "recipes", label: "Recipes", icon: ChefHat },
  { id: "equipment", label: "Equipment", icon: CookingPot },
];

const recipes = [
  {
    title: "Skillet salmon with wilted spinach",
    eyebrow: "Best match",
    time: "22 min",
    servings: "2 servings",
    equipment: "Cast-iron skillet",
    equipmentId: "skillet",
    ingredients: ["salmon", "spinach"],
    accent: "salmon",
    reason: "Uses both ingredients that need attention first.",
  },
  {
    title: "Crispy carrot & yogurt bowls",
    eyebrow: "Low effort",
    time: "28 min",
    servings: "2 servings",
    equipment: "Air fryer",
    equipmentId: "air-fryer",
    ingredients: ["carrot", "yogurt", "rice"],
    accent: "carrot",
    reason: "A flexible bowl using three things you already have.",
  },
  {
    title: "Green yogurt breakfast shake",
    eyebrow: "Quick rescue",
    time: "6 min",
    servings: "2 servings",
    equipment: "Countertop blender",
    equipmentId: "blender",
    ingredients: ["spinach", "yogurt"],
    accent: "green",
    reason: "Saves your spinach with almost no prep.",
  },
  {
    title: "Golden egg fried rice",
    eyebrow: "Pantry fallback",
    time: "18 min",
    servings: "2 servings",
    equipment: "Cast-iron skillet",
    equipmentId: "skillet",
    ingredients: ["egg", "rice"],
    accent: "carrot",
    reason: "A dependable dinner from two long-lasting staples.",
  },
];

export function PantryApp({
  initialItems,
  initialEquipment: providedEquipment,
  dataMode = "demo",
  householdId,
  userId,
  displayName = "Wesley",
}: {
  initialItems?: InventoryItem[];
  initialEquipment?: EquipmentItem[];
  dataMode?: "demo" | "live";
  householdId?: string;
  userId?: string;
  displayName?: string;
}) {
  const [activeView, setActiveView] = useState<View>("overview");
  const [items, setItems] = useState<InventoryItem[]>(() => initialItems ?? makeInventory());
  const [equipment, setEquipment] = useState<EquipmentItem[]>(providedEquipment ?? initialEquipment);
  const [modal, setModal] = useState<"grocery" | "equipment" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | "All">("All");
  const [sortBy, setSortBy] = useState<"expiration" | "name" | "added">("expiration");
  const [recipeIndex, setRecipeIndex] = useState(0);

  const activeItems = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const visibleItems = useMemo(() => {
    const filtered = activeItems.filter((item) => categoryFilter === "All" || item.category === categoryFilter);
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "added") return b.addedAt.localeCompare(a.addedAt);
      return a.expirationDate.localeCompare(b.expirationDate);
    });
  }, [activeItems, categoryFilter, sortBy]);

  const urgentItems = [...items]
    .filter((item) => daysUntil(item.expirationDate) <= 3)
    .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));

  const eligibleRecipes = recipes.filter(
    (candidate) =>
      equipment.some(
        (item) =>
          item.id === candidate.equipmentId ||
          item.name.toLowerCase().includes(candidate.equipment.toLowerCase()),
      ) &&
      candidate.ingredients.every((ingredient) =>
        items.some((item) => item.name.toLowerCase().includes(ingredient)),
      ),
  );
  const recipe = eligibleRecipes.length ? eligibleRecipes[recipeIndex % eligibleRecipes.length] : undefined;

  const consumeItem = async (id: string) => {
    if (dataMode === "live") {
      const { error } = await createSupabaseClient()
        .from("inventory_items")
        .update({ status: "consumed", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return setToast("That item could not be marked as used. Please try again.");
    }
    setItems((current) => current.filter((item) => item.id !== id));
    setToast("Item moved to your consumed history.");
  };

  const deleteItem = async (id: string) => {
    if (dataMode === "live") {
      const { error } = await createSupabaseClient().from("inventory_items").delete().eq("id", id);
      if (error) return setToast("That item could not be deleted. Please try again.");
    }
    setItems((current) => current.filter((item) => item.id !== id));
    setToast("Item deleted.");
  };

  const saveGrocery = async (item: InventoryItem) => {
    if (dataMode === "live") {
      if (!householdId || !userId) return setToast("Your household session is missing. Please sign in again.");
      const { error } = await createSupabaseClient().from("inventory_items").insert({
        id: item.id,
        household_id: householdId,
        created_by: userId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        storage_location: item.location,
        added_at: new Date(`${item.addedAt}T12:00:00`).toISOString(),
        expiration_date: item.expirationDate,
        expiration_source: item.expirationSource,
      });
      if (error) return setToast("That grocery could not be saved. Please try again.");
    }
    setItems((current) => [item, ...current]);
    setModal(null);
    setToast(`${item.name} added to your kitchen.`);
  };

  const saveEquipment = async (item: EquipmentItem) => {
    if (dataMode === "live") {
      if (!householdId || !userId) return setToast("Your household session is missing. Please sign in again.");
      const { error } = await createSupabaseClient().from("equipment").insert({
        id: item.id,
        household_id: householdId,
        created_by: userId,
        name: item.name,
        kind: item.kind,
        capabilities: [item.capability],
      });
      if (error) return setToast("That equipment could not be saved. Please try again.");
    }
    setEquipment((current) => [item, ...current]);
    setModal(null);
    setToast(`${item.name} added to your equipment.`);
  };

  const signOut = async () => {
    if (dataMode !== "live") return;
    await createSupabaseClient().auth.signOut();
    window.location.assign("/login");
  };

  const renderContent = () => {
    if (activeView === "inventory") {
      return (
        <InventoryView
          items={visibleItems}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onAdd={() => setModal("grocery")}
          onConsume={consumeItem}
          onDelete={deleteItem}
        />
      );
    }

    if (activeView === "equipment") {
      return <EquipmentView equipment={equipment} onAdd={() => setModal("equipment")} />;
    }

    if (activeView === "recipes") {
      return (
        <RecipesView
          recipe={recipe}
          urgentItems={urgentItems}
          onNext={() => setRecipeIndex((index) => index + 1)}
        />
      );
    }

    return (
      <Overview
        items={items}
        urgentItems={urgentItems}
        recipe={recipe}
        recipeMatchCount={eligibleRecipes.length}
        onAdd={() => setModal("grocery")}
        onConsume={consumeItem}
        onSeeInventory={() => setActiveView("inventory")}
        onSeeRecipes={() => setActiveView("recipes")}
        onNextRecipe={() => setRecipeIndex((index) => index + 1)}
        displayName={displayName}
      />
    );
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <button className={styles.brand} onClick={() => setActiveView("overview")} aria-label="The Pantry home">
          <span className={styles.brandMark}><Leaf size={19} strokeWidth={2.4} /></span>
          <span>The Pantry</span>
        </button>

        <nav className={styles.nav} aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? styles.navActive : styles.navItem}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarSpacer} />
        <div className={styles.wasteCard}>
          <span className={styles.wasteIcon}>🌱</span>
          <strong>Good habits grow</strong>
          <p>You’ve rescued 4 items this week.</p>
        </div>
        <button className={styles.profileButton} onClick={signOut} title={dataMode === "live" ? "Sign out" : "Prototype profile"}>
          <span className={styles.avatar}>{displayName.slice(0, 2).toUpperCase()}</span>
          <span><strong>{displayName}&apos;s kitchen</strong><small>{dataMode === "live" ? "Live household" : "Prototype mode"}</small></span>
          <ChevronRight size={17} />
        </button>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <label className={styles.search}>
            <Search size={18} aria-hidden="true" />
            <span className={styles.srOnly}>Search groceries</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your kitchen" />
          </label>
          <div className={styles.topActions}>
            <span className={styles.syncStatus}><span /> {dataMode === "live" ? "Live sync" : "Demo data"}</span>
            <button className={styles.iconButton} aria-label="Notifications"><Bell size={19} /></button>
            <button className={styles.mobileAvatar} aria-label="Open profile">{displayName.slice(0, 2).toUpperCase()}</button>
          </div>
        </header>

        <div className={styles.content}>{renderContent()}</div>
      </main>

      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={activeView === item.id ? styles.mobileNavActive : ""} onClick={() => setActiveView(item.id)}>
              <Icon size={19} /><span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {modal === "grocery" && (
        <GroceryDialog
          onClose={() => setModal(null)}
          onSave={saveGrocery}
        />
      )}
      {modal === "equipment" && (
        <EquipmentDialog
          onClose={() => setModal(null)}
          onSave={saveEquipment}
        />
      )}
      {toast && <button className={styles.toast} onClick={() => setToast(null)}>{toast}<X size={15} /></button>}
    </div>
  );
}

function Overview({
  items,
  urgentItems,
  recipe,
  recipeMatchCount,
  onAdd,
  onConsume,
  onSeeInventory,
  onSeeRecipes,
  onNextRecipe,
  displayName,
}: {
  items: InventoryItem[];
  urgentItems: InventoryItem[];
  recipe: (typeof recipes)[number] | undefined;
  recipeMatchCount: number;
  onAdd: () => void;
  onConsume: (id: string) => void;
  onSeeInventory: () => void;
  onSeeRecipes: () => void;
  onNextRecipe: () => void;
  displayName: string;
}) {
  const todayLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <>
      <section className={styles.pageIntro}>
        <div>
          <span className={styles.kicker}>{todayLabel}</span>
          <h1>Good morning, {displayName}.</h1>
          <p>Your kitchen is in good shape. Let’s use what needs attention.</p>
        </div>
        <button className={styles.primaryButton} onClick={onAdd}><Plus size={18} /> Add groceries</button>
      </section>

      <section className={styles.summaryGrid} aria-label="Kitchen summary">
        <article className={`${styles.summaryCard} ${styles.summaryPrimary}`}>
          <span className={styles.summaryIcon}><Refrigerator size={21} /></span>
          <div><strong>{items.length}</strong><span>items on hand</span></div>
          <small>Across fridge, freezer & pantry</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.orangeIcon}`}><Clock3 size={21} /></span>
          <div><strong>{urgentItems.length}</strong><span>use soon</span></div>
          <small>Within the next 3 days</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.blueIcon}`}><ChefHat size={21} /></span>
          <div><strong>{recipeMatchCount}</strong><span>recipe matches</span></div>
          <small>Using equipment you own</small>
        </article>
      </section>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div><span className={styles.eyebrow}>Use next</span><h2>Don’t let these go to waste</h2></div>
            <button className={styles.textButton} onClick={onSeeInventory}>View inventory <ChevronRight size={16} /></button>
          </div>
          <div className={styles.urgentList}>
            {urgentItems.length === 0 ? (
              <div className={styles.emptyState}><Sparkles size={22} /><strong>Nothing urgent</strong><span>Your kitchen is looking fresh.</span></div>
            ) : urgentItems.map((item) => (
              <article className={styles.urgentRow} key={item.id}>
                <span className={styles.foodEmoji}>{item.emoji}</span>
                <div className={styles.itemMain}>
                  <strong>{item.name}</strong>
                  <span>{item.quantity} {item.unit} · {item.location}</span>
                </div>
                <FreshnessBadge date={item.expirationDate} />
                <button className={styles.usedButton} onClick={() => onConsume(item.id)}><Check size={15} /> Used</button>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.recipePanel}`}>
          {recipe ? (
            <>
              <div className={styles.recipeArt} data-accent={recipe.accent}>
                <span className={styles.recipeLeaf}>✦</span>
                <span className={styles.recipeBowl}>🍽️</span>
                <span className={styles.matchPill}><Sparkles size={14} /> {recipe.eyebrow}</span>
              </div>
              <div className={styles.recipeBody}>
                <span className={styles.eyebrow}>Tonight’s suggestion</span>
                <h2>{recipe.title}</h2>
                <p>{recipe.reason}</p>
                <div className={styles.recipeMeta}>
                  <span><Timer size={16} /> {recipe.time}</span>
                  <span><Utensils size={16} /> {recipe.equipment}</span>
                </div>
                <div className={styles.recipeActions}>
                  <button className={styles.darkButton} onClick={onSeeRecipes}>See recipe <ChevronRight size={16} /></button>
                  <button className={styles.roundButton} onClick={onNextRecipe} aria-label="Show another recipe"><WandSparkles size={17} /></button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}><ChefHat size={22} /><strong>No recipe matches</strong><span>Add more groceries or equipment to unlock suggestions.</span></div>
          )}
        </section>
      </div>

      <section className={styles.inventoryStrip}>
        <div className={styles.panelHeader}>
          <div><span className={styles.eyebrow}>Your kitchen</span><h2>Recently added</h2></div>
          <button className={styles.textButton} onClick={onSeeInventory}>See all {items.length} items <ChevronRight size={16} /></button>
        </div>
        <div className={styles.recentGrid}>
          {[...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 4).map((item) => <MiniItemCard key={item.id} item={item} />)}
        </div>
      </section>
    </>
  );
}

function InventoryView({
  items,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  onAdd,
  onConsume,
  onDelete,
}: {
  items: InventoryItem[];
  categoryFilter: FoodCategory | "All";
  setCategoryFilter: (category: FoodCategory | "All") => void;
  sortBy: "expiration" | "name" | "added";
  setSortBy: (sort: "expiration" | "name" | "added") => void;
  onAdd: () => void;
  onConsume: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <section className={styles.pageIntro}>
        <div><span className={styles.kicker}>Everything in one place</span><h1>Kitchen inventory</h1><p>Filter, sort, and keep tabs on what should be used next.</p></div>
        <button className={styles.primaryButton} onClick={onAdd}><Plus size={18} /> Add groceries</button>
      </section>
      <section className={styles.filterBar}>
        <label><SlidersHorizontal size={17} /><span className={styles.srOnly}>Filter by category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as FoodCategory | "All")}>
            <option value="All">All categories</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label><ArrowUpDown size={17} /><span className={styles.srOnly}>Sort inventory</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
            <option value="expiration">Expiration date</option>
            <option value="name">Item name</option>
            <option value="added">Recently added</option>
          </select>
        </label>
        <span className={styles.resultCount}>{items.length} items</span>
      </section>
      <section className={styles.inventoryTable}>
        <div className={styles.tableHead}><span>Item</span><span>Category</span><span>Stored in</span><span>Added</span><span>Freshness</span><span>Actions</span></div>
        {items.map((item) => (
          <article className={styles.tableRow} key={item.id}>
            <div className={styles.tableItem}><span className={styles.foodEmoji}>{item.emoji}</span><span><strong>{item.name}</strong><small>{item.quantity} {item.unit}</small></span></div>
            <span>{item.category}</span>
            <span className={styles.location}><MapPin size={14} />{item.location}</span>
            <span>{new Date(`${item.addedAt}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            <FreshnessBadge date={item.expirationDate} />
            <div className={styles.rowActions}>
              <button onClick={() => onConsume(item.id)} title="Mark as used"><Check size={16} /></button>
              <button onClick={() => onDelete(item.id)} title="Delete item"><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function EquipmentView({ equipment, onAdd }: { equipment: EquipmentItem[]; onAdd: () => void }) {
  return (
    <>
      <section className={styles.pageIntro}>
        <div><span className={styles.kicker}>What you cook with</span><h1>Kitchen equipment</h1><p>Recipe suggestions only use appliances and tools you have.</p></div>
        <button className={styles.primaryButton} onClick={onAdd}><Plus size={18} /> Add equipment</button>
      </section>
      <section className={styles.equipmentHero}>
        <div><span className={styles.summaryIcon}><CookingPot size={22} /></span><strong>{equipment.length}</strong><span>tools ready to cook</span></div>
        <p>Keeping this list accurate makes recipe suggestions more useful—and saves you from discovering a missing blender halfway through dinner.</p>
      </section>
      <section className={styles.equipmentGrid}>
        {equipment.map((item) => (
          <article className={styles.equipmentCard} key={item.id}>
            <span className={styles.equipmentEmoji}>{item.emoji}</span>
            <span className={styles.equipmentKind}>{item.kind}</span>
            <h2>{item.name}</h2>
            <p>{item.capability}</p>
            <span className={styles.readyBadge}><Check size={14} /> Available</span>
          </article>
        ))}
      </section>
    </>
  );
}

function RecipesView({ recipe, urgentItems, onNext }: { recipe: (typeof recipes)[number] | undefined; urgentItems: InventoryItem[]; onNext: () => void }) {
  return (
    <>
      <section className={styles.pageIntro}>
        <div><span className={styles.kicker}>Cook what you have</span><h1>Recipe studio</h1><p>Suggestions prioritize expiring food and equipment already in your kitchen.</p></div>
        {recipe && <button className={styles.primaryButton} onClick={onNext}><WandSparkles size={18} /> Find another</button>}
      </section>
      {recipe ? (
        <section className={styles.recipeFeature}>
          <div className={styles.recipeFeatureArt} data-accent={recipe.accent}><span>🍽️</span><div><Sparkles size={16} /> {recipe.eyebrow}</div></div>
          <div className={styles.recipeFeatureBody}>
            <span className={styles.eyebrow}>Recommended for your kitchen</span>
            <h2>{recipe.title}</h2>
            <p>{recipe.reason}</p>
            <div className={styles.recipeMeta}><span><Timer size={17} />{recipe.time}</span><span><Utensils size={17} />{recipe.equipment}</span><span><Boxes size={17} />{recipe.servings}</span></div>
            <div className={styles.ingredientChecklist}>
              <h3>From your kitchen</h3>
              {recipe.ingredients.map((ingredient) => <span key={ingredient}><Check size={15} />{ingredient[0].toUpperCase() + ingredient.slice(1)}</span>)}
            </div>
            <button className={styles.darkButton}>Start cooking <ChevronRight size={16} /></button>
          </div>
        </section>
      ) : (
        <section className={styles.recipeFeature}>
          <div className={styles.emptyState}><ChefHat size={22} /><strong>No recipe matches</strong><span>Add more groceries or equipment to unlock suggestions.</span></div>
        </section>
      )}
      <section className={styles.rescueNote}>
        <span><Flame size={20} /></span>
        <div><strong>Use-it-up priority</strong><p>{urgentItems.length ? `${urgentItems.map((item) => item.name).join(" and ")} influenced this suggestion.` : "Nothing is close to expiring, so the app favored variety."}</p></div>
      </section>
    </>
  );
}

function MiniItemCard({ item }: { item: InventoryItem }) {
  return (
    <article className={styles.miniCard}>
      <span className={styles.foodEmoji}>{item.emoji}</span>
      <div><strong>{item.name}</strong><span>{item.quantity} {item.unit}</span></div>
      <FreshnessBadge date={item.expirationDate} compact />
    </article>
  );
}

function FreshnessBadge({ date, compact = false }: { date: string; compact?: boolean }) {
  const days = daysUntil(date);
  const tone = days <= 0 ? "danger" : days <= 3 ? "warning" : "fresh";
  return <span className={`${styles.freshness} ${styles[tone]}`} title={`Expires ${date}`}>{compact && days > 3 ? "Fresh" : freshnessLabel(date)}</span>;
}

function GroceryDialog({ onClose, onSave }: { onClose: () => void; onSave: (item: InventoryItem) => void | Promise<void> }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("item");
  const [category, setCategory] = useState<FoodCategory>("Other");
  const [location, setLocation] = useState<StorageLocation>("Fridge");
  const [expiration, setExpiration] = useState(addDaysIso(new Date(), 7));
  const [manualExpiration, setManualExpiration] = useState(false);
  const [manualCategory, setManualCategory] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateName = (value: string) => {
    setName(value);
    if (manualCategory) return;
    const inferred = inferCategory(value);
    setCategory(inferred);
    if (!manualExpiration) setExpiration(addDaysIso(new Date(), suggestedExpirationDays(inferred)));
  };

  const updateCategory = (value: FoodCategory) => {
    setCategory(value);
    setManualCategory(true);
    if (!manualExpiration) setExpiration(addDaysIso(new Date(), suggestedExpirationDays(value)));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        id: crypto.randomUUID(),
        name: name.trim(),
        emoji: emojiForCategory[category],
        quantity: Number(quantity) || 1,
        unit: unit.trim() || "item",
        category,
        location,
        addedAt: addDaysIso(new Date(), 0),
        expirationDate: expiration,
        expirationSource: manualExpiration ? "manual" : "suggested",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="grocery-title">
        <div className={styles.dialogHeader}><div><span className={styles.eyebrow}>New inventory item</span><h2 id="grocery-title">Add groceries</h2></div><button onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.fullField}><span>Item name</span><input autoFocus required value={name} onChange={(event) => updateName(event.target.value)} placeholder="e.g. Baby spinach" /></label>
          <div className={styles.formRow}>
            <label><span>Quantity</span><input min="0.1" step="0.1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
            <label><span>Unit</span><input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="bag, lb, pieces" /></label>
          </div>
          <div className={styles.formRow}>
            <label><span>Category <small>suggested</small></span><select value={category} onChange={(event) => updateCategory(event.target.value as FoodCategory)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Storage</span><select value={location} onChange={(event) => setLocation(event.target.value as StorageLocation)}><option>Fridge</option><option>Freezer</option><option>Pantry</option></select></label>
          </div>
          <label className={styles.fullField}><span>Expiration date <small>{manualExpiration ? "your date" : "suggested"}</small></span><input type="date" required value={expiration} onChange={(event) => { setExpiration(event.target.value); setManualExpiration(true); }} /></label>
          <div className={styles.suggestionNote}><Sparkles size={17} /><span>We suggested this date from the food category. You can always replace it.</span></div>
          <div className={styles.dialogActions}><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} type="submit" disabled={saving}><Plus size={17} /> {saving ? "Adding…" : "Add item"}</button></div>
        </form>
      </section>
    </div>
  );
}

function EquipmentDialog({ onClose, onSave }: { onClose: () => void; onSave: (item: EquipmentItem) => void | Promise<void> }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("Appliance");
  const [capability, setCapability] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({ id: crypto.randomUUID(), name: name.trim(), kind, capability: capability.trim() || "Ready to cook", emoji: kind === "Appliance" ? "⚡" : kind === "Cookware" ? "🍳" : "🥄" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="equipment-title">
        <div className={styles.dialogHeader}><div><span className={styles.eyebrow}>Your cooking setup</span><h2 id="equipment-title">Add equipment</h2></div><button onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.fullField}><span>Name</span><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Immersion blender" /></label>
          <label className={styles.fullField}><span>Type</span><select value={kind} onChange={(event) => setKind(event.target.value)}><option>Appliance</option><option>Cookware</option><option>Utensil</option></select></label>
          <label className={styles.fullField}><span>Capabilities</span><input value={capability} onChange={(event) => setCapability(event.target.value)} placeholder="e.g. Blend soups & sauces" /></label>
          <div className={styles.dialogActions}><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} type="submit" disabled={saving}><Plus size={17} /> {saving ? "Adding…" : "Add equipment"}</button></div>
        </form>
      </section>
    </div>
  );
}
