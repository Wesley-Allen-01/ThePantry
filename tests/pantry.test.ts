process.env.TZ = "America/Denver";

import assert from "node:assert/strict";
import test from "node:test";
import {
  addDaysIso,
  daysUntil,
  freshnessLabel,
  inferCategory,
  suggestedExpirationDays,
} from "../lib/pantry.ts";

test("suggests useful food categories", () => {
  assert.equal(inferCategory("Baby spinach"), "Produce");
  assert.equal(inferCategory("Greek yogurt"), "Dairy & eggs");
  assert.equal(inferCategory("Wild salmon"), "Meat & seafood");
  assert.equal(inferCategory("Mystery jar"), "Other");
});

test("prefers more specific hints over shorter substrings", () => {
  assert.equal(inferCategory("Ice cream"), "Frozen");
  assert.equal(inferCategory("Heavy cream"), "Dairy & eggs");
  assert.equal(inferCategory("Frozen peas"), "Frozen");
});

test("suggests category-specific shelf life", () => {
  assert.equal(suggestedExpirationDays("Meat & seafood"), 2);
  assert.equal(suggestedExpirationDays("Frozen"), 90);
});

test("calculates freshness consistently", () => {
  const now = new Date("2026-07-10T08:00:00-06:00");
  assert.equal(daysUntil("2026-07-10", now), 0);
  assert.equal(freshnessLabel("2026-07-11", now), "1 day left");
  assert.equal(freshnessLabel("2026-07-15", now), "Fresh");
  assert.equal(addDaysIso(now, 2), "2026-07-12");
});

test("addDaysIso rolls over months correctly", () => {
  const now = new Date("2026-07-30T08:00:00-06:00");
  assert.equal(addDaysIso(now, 3), "2026-08-02");
});

test("daysUntil boundary cases", () => {
  const now = new Date("2026-07-10T08:00:00-06:00");
  assert.equal(daysUntil("2026-07-09", now), -1, "yesterday should be expired (negative)");
  assert.ok(daysUntil("2026-06-01", now) < 0, "far past date should be negative");
  assert.equal(daysUntil("2026-07-10", now), 0, "today should be 0");
  assert.equal(freshnessLabel("2026-07-09", now), "Expired");
  assert.equal(freshnessLabel("2026-07-10", now), "Use today");
});
