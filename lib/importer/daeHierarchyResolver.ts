export type DaeResolvedNode = {
  id: string;
  name: string;
  type: "node" | "instance_node" | "geometry";
  matrix?: number[];
  url?: string;
  children: DaeResolvedNode[];
};

export type DaeHierarchyResult = {
  sourceFormat: "dae";
  nodeCount: number;
  instanceNodeCount: number;
  geometryCount: number;
  rootNodes: DaeResolvedNode[];
  warnings: string[];
};

function readMatrix(node: Element): number[] | undefined {
  const matrix = node.querySelector(":scope > matrix");
  if (!matrix?.textContent) return undefined;

  return matrix.textContent
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function resolveNode(node: Element): DaeResolvedNode {
  const name = node.getAttribute("name") || node.getAttribute("id") || "Unnamed";
  const id = node.getAttribute("id") || name;

  const result: DaeResolvedNode = {
    id,
    name,
    type: "node",
    matrix: readMatrix(node),
    children: [],
  };

  node.querySelectorAll(":scope > instance_node").forEach((instance) => {
    result.children.push({
      id: instance.getAttribute("url")?.replace("#", "") || "instance_node",
      name: instance.getAttribute("name") || "Instance Node",
      type: "instance_node",
      url: instance.getAttribute("url") || undefined,
      children: [],
    });
  });

  node.querySelectorAll(":scope > instance_geometry").forEach((geo) => {
    result.children.push({
      id: geo.getAttribute("url")?.replace("#", "") || "geometry",
      name: geo.getAttribute("name") || "Geometry",
      type: "geometry",
      url: geo.getAttribute("url") || undefined,
      children: [],
    });
  });

  node.querySelectorAll(":scope > node").forEach((child) => {
    result.children.push(resolveNode(child));
  });

  return result;
}

export function resolveDaeHierarchy(daeText: string): DaeHierarchyResult {
  const parser = new DOMParser();
  const xml = parser.parseFromString(daeText, "application/xml");

  const parseError = xml.querySelector("parsererror");
  if (parseError) {
    throw new Error("DAE non valido: errore parsing XML.");
  }

  const visualScene = xml.querySelector("library_visual_scenes visual_scene");
  const rootNodes = Array.from(visualScene?.querySelectorAll(":scope > node") || []).map(resolveNode);

  const instanceNodeCount = xml.querySelectorAll("instance_node").length;
  const geometryCount = xml.querySelectorAll("instance_geometry").length;
  const nodeCount = xml.querySelectorAll("node").length;

  const warnings: string[] = [];

  if (instanceNodeCount > 0) {
    warnings.push("DAE usa instance_node: serve ricostruzione gerarchia prima del GLB.");
  }

  if (!visualScene) {
    warnings.push("Nessuna visual_scene trovata nel DAE.");
  }

  return {
    sourceFormat: "dae",
    nodeCount,
    instanceNodeCount,
    geometryCount,
    rootNodes,
    warnings,
  };
}