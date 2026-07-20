export function isProductEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_PRODUCT_ENABLED;
  if (v === undefined || v === "") return true;
  return v === "true" || v === "1";
}
