import { demoProduct2 } from "./demo-product-2";

export const productCatalog = [
  demoProduct2,
];

export const getProductById = (id: string) => {
  return productCatalog.find((p) => p.id === id);
};