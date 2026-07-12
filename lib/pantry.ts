export type FoodCategory =
  | "Produce"
  | "Meat & seafood"
  | "Dairy & eggs"
  | "Grains & bakery"
  | "Frozen"
  | "Condiments"
  | "Prepared food"
  | "Other";

const CATEGORY_HINTS: Array<[FoodCategory, string[]]> = [
  ["Produce", ["apple", "avocado", "banana", "berry", "carrot", "lettuce", "onion", "pepper", "spinach", "tomato"]],
  ["Meat & seafood", ["beef", "chicken", "fish", "pork", "salmon", "shrimp", "turkey"]],
  ["Dairy & eggs", ["butter", "cheese", "cream", "egg", "milk", "yogurt"]],
  ["Grains & bakery", ["bagel", "bread", "pasta", "rice", "tortilla"]],
  ["Frozen", ["frozen", "ice cream"]],
  ["Condiments", ["dressing", "jam", "ketchup", "mayo", "mustard", "sauce"]],
  ["Prepared food", ["leftover", "meal prep", "soup"]],
];

const EXPIRATION_DAYS: Record<FoodCategory, number> = {
  Produce: 7,
  "Meat & seafood": 2,
  "Dairy & eggs": 10,
  "Grains & bakery": 6,
  Frozen: 90,
  Condiments: 60,
  "Prepared food": 4,
  Other: 7,
};

export function inferCategory(name: string): FoodCategory {
  const normalized = name.trim().toLowerCase();
  let bestCategory: FoodCategory | null = null;
  let bestHintLength = -1;
  for (const [category, hints] of CATEGORY_HINTS) {
    for (const hint of hints) {
      if (normalized.includes(hint) && hint.length > bestHintLength) {
        bestCategory = category;
        bestHintLength = hint.length;
      }
    }
  }
  return bestCategory ?? "Other";
}

export function suggestedExpirationDays(category: FoodCategory): number {
  return EXPIRATION_DAYS[category];
}

export function addDaysIso(date: Date, days: number): string {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() + days);
  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, "0");
  const day = String(result.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysUntil(date: string, now = new Date()): number {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const target = new Date(`${date}T12:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function freshnessLabel(date: string, now = new Date()): string {
  const days = daysUntil(date, now);
  if (days < 0) return "Expired";
  if (days === 0) return "Use today";
  if (days === 1) return "1 day left";
  if (days <= 3) return `${days} days left`;
  return "Fresh";
}
