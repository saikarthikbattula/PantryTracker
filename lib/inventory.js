export function itemId(name) {
  return encodeURIComponent(name.trim().normalize("NFKC").toLowerCase());
}
export function validateItem(item) {
  const name = item.name?.trim().normalize("NFKC");
  const quantity = Number(item.quantity);
  if (
    !name ||
    name.length > 80 ||
    name.includes(String.fromCharCode(92)) ||
    /[\/\x00-\x1f]/.test(name)
  )
    throw new Error("Use an item name of 1–80 characters without slashes.");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999)
    throw new Error("Quantity must be a whole number from 1 to 9,999.");
  if (
    !["Produce", "Grains", "Dairy", "Protein", "Other"].includes(item.category)
  )
    throw new Error("Choose a category.");
  if (
    item.expires &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(item.expires) ||
      Number.isNaN(Date.parse(item.expires)))
  )
    throw new Error("Choose a valid expiry date.");
  return {
    name,
    quantity,
    category: item.category,
    expires: item.expires || "",
  };
}
export const sample = [
  { id: "rice", name: "Rice", quantity: 2, category: "Grains", expires: "" },
  {
    id: "tomatoes",
    name: "Tomatoes",
    quantity: 4,
    category: "Produce",
    expires: "",
  },
  {
    id: "chickpeas",
    name: "Chickpeas",
    quantity: 3,
    category: "Protein",
    expires: "",
  },
];
export function mergeItem(previous, item) {
  const next = validateItem(item);
  return validateItem({
    ...next,
    quantity: (previous?.quantity || 0) + next.quantity,
  });
}
