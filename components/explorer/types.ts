import type { MutableRefObject } from "react";

export type RuntimeComponent = {
  id?: string;
  partId?: string;
  meshName?: string;
  name?: string;
  displayName?: string;
  originalName?: string;
  category?: string;
  productName?: string;
  productId?: string;
  moduleName?: string;
  moduleId?: string;
  groupName?: string;
  parentName?: string;
  index?: number;
  [key: string]: any;
};

export type ComponentRowRefs = MutableRefObject<Record<string, HTMLButtonElement | null>>;

export type ComponentExplorerModule = {
  id: string;
  name: string;
  subtitle: string;
  components: RuntimeComponent[];
};
