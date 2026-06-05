import type { ComponentExplorerModule, RuntimeComponent } from "./types";

export function getComponentId(component: RuntimeComponent): string {
  return String(component?.id || component?.partId || component?.meshName || component?.name || component?.displayName || "");
}

export function getComponentAliases(component: RuntimeComponent): string[] {
  return [component?.id, component?.partId, component?.meshName, component?.name, component?.displayName, component?.originalName]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

export function getComponentLabel(component: RuntimeComponent, fallbackId: string): string {
  return String(component?.displayName || component?.name || component?.originalName || fallbackId || "Pezzo");
}

function normalizeModuleLabel(value: unknown): string {
  const label = String(value || "").trim();
  return label.length > 0 ? label : "";
}

export function getComponentModuleKey(component: RuntimeComponent): string {
  const explicit =
    normalizeModuleLabel(component?.moduleName) ||
    normalizeModuleLabel(component?.moduleId) ||
    normalizeModuleLabel(component?.productName) ||
    normalizeModuleLabel(component?.productId) ||
    normalizeModuleLabel(component?.groupName) ||
    normalizeModuleLabel(component?.parentName);

  if (explicit) return explicit;

  const source = normalizeModuleLabel(component?.partId) || normalizeModuleLabel(component?.meshName) || normalizeModuleLabel(component?.id);
  const softMatch = source.match(/^([A-Za-zÀ-ÿ0-9]+(?:[_\-\s][A-Za-zÀ-ÿ0-9]+){0,3})[_\-\.]/);
  return softMatch?.[1] || "Modulo 1";
}

export function buildComponentModules(components: RuntimeComponent[]): ComponentExplorerModule[] {
  const groups = new Map<string, RuntimeComponent[]>();

  components.forEach((component, index) => {
    const normalizedComponent = { ...component, index: component?.index ?? index + 1 };
    const key = getComponentModuleKey(normalizedComponent);
    const current = groups.get(key) || [];
    current.push(normalizedComponent);
    groups.set(key, current);
  });

  return Array.from(groups.entries()).map(([key, group], index) => ({
    id: `module-${index + 1}-${key}`.replace(/[^a-zA-Z0-9_-]+/g, "-"),
    name: key || `Modulo ${index + 1}`,
    subtitle: `${group.length} ${group.length === 1 ? "pezzo" : "pezzi"}`,
    components: group,
  }));
}

export function componentMatchesSearch(component: RuntimeComponent, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return getComponentAliases(component)
    .concat([
      component?.category,
      component?.moduleName,
      component?.moduleId,
      component?.productName,
      component?.productId,
      component?.groupName,
      component?.parentName,
    ].map((value) => String(value || "")))
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}
