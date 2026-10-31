import test from "node:test";
import assert from "node:assert/strict";
import { validateItem, itemId, mergeItem } from "../lib/inventory.js";
const item = { name: " Rice ", quantity: 2, category: "Grains", expires: "" };
test("normalizes names and rejects invalid quantities and document paths", () => {
  assert.equal(validateItem(item).name, "Rice");
  assert.equal(itemId(" RICE "), itemId("rice"));
  for (const quantity of [0, -1, 1.5, 10000, "bad", ""])
    assert.throws(() => validateItem({ ...item, quantity }));
  for (const name of ["", "a/b", "a\\b"])
    assert.throws(() => validateItem({ ...item, name }));
});
test("merge preserves quantity and rejects overflow", () => {
  assert.equal(mergeItem({ quantity: 3 }, item).quantity, 5);
  assert.throws(() => mergeItem({ quantity: 9999 }, item));
});
