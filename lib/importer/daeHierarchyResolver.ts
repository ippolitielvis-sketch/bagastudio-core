export type DaeResolvedNode = {
  id: string;
  name: string;
  type: "node" | "instance_node" | "geometry";
  matrix?: number[];
  url?: string;
  targetId?: string;
  targetFound?: boolean;
  parentId?: string | null;
  depth?: number;
  children: DaeResolvedNode[];
};

export type DaeNodeMapEntry = {
  id: string;
  name: string;
  source: "visual_scene" | "library_nodes";
  hasMatrix: boolean;
  childNodeCount: number;
  instanceNodeCount: number;
  geometryCount: number;
};

export type DaeInstanceNodeLink = {
  parentId: string;
  parentName: string;
  instanceName: string;
  url: string;
  targetId: string;
  targetFound: boolean;
  targetName?: string;
  targetHasMatrix?: boolean;
  parentHasMatrix: boolean;
  depth: number;
};

export type DaeInstanceTargetUsage = {
  targetId: string;
  targetName?: string;
  usageCount: number;
  parentIds: string[];
  parentNames: string[];
  instanceNames: string[];
};

export type DaeHierarchyDiagnostics = {
  nodeMap: DaeNodeMapEntry[];
  libraryNodeMap: DaeNodeMapEntry[];
  visualSceneNodeMap: DaeNodeMapEntry[];
  resolvedInstanceLinks: DaeInstanceNodeLink[];
  unresolvedInstanceLinks: DaeInstanceNodeLink[];
  instanceTargetUsage: DaeInstanceTargetUsage[];
  duplicateTargetIds: string[];
  multiUseTargetIds: string[];
  duplicateNodeIds: string[];
  nodesWithMatrixCount: number;
  libraryNodesCount: number;
  visualSceneRootCount: number;
  maxDepth: number;
};

export type DaeHierarchyResult = {
  sourceFormat: "dae";
  nodeCount: number;
  instanceNodeCount: number;
  geometryCount: number;
  rootNodes: DaeResolvedNode[];
  warnings: string[];
  diagnostics: DaeHierarchyDiagnostics;
};

function readMatrix(node: Element): number[] | undefined {
  const matrix = node.querySelector(":scope > matrix");
  if (!matrix?.textContent) return undefined;

  const values = matrix.textContent
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));

  return values.length === 16 ? values : undefined;
}

function getNodeName(node: Element) {
  return node.getAttribute("name") || node.getAttribute("id") || "Unnamed";
}

function getNodeId(node: Element) {
  return node.getAttribute("id") || getNodeName(node);
}

function cleanUrlId(url: string | null) {
  return url?.replace(/^#/, "") || "";
}

function getDirectChildren(node: Element, selector: string) {
  return Array.from(node.querySelectorAll(selector));
}

function getDirectNodeChildren(node: Element) {
  return getDirectChildren(node, ":scope > node");
}

function getDirectInstanceNodeChildren(node: Element) {
  return getDirectChildren(node, ":scope > instance_node");
}

function getDirectGeometryChildren(node: Element) {
  return getDirectChildren(node, ":scope > instance_geometry");
}

function createNodeMapEntry(
  node: Element,
  source: "visual_scene" | "library_nodes"
): DaeNodeMapEntry {
  return {
    id: getNodeId(node),
    name: getNodeName(node),
    source,
    hasMatrix: Boolean(readMatrix(node)),
    childNodeCount: getDirectNodeChildren(node).length,
    instanceNodeCount: getDirectInstanceNodeChildren(node).length,
    geometryCount: getDirectGeometryChildren(node).length,
  };
}

function buildNodeMaps(xml: Document) {
  const visualSceneNodes = Array.from(
    xml.querySelectorAll("library_visual_scenes visual_scene node")
  );
  const libraryNodes = Array.from(xml.querySelectorAll("library_nodes node"));
  const allNodes = [...visualSceneNodes, ...libraryNodes];

  const entryById = new Map<string, DaeNodeMapEntry>();
  const elementById = new Map<string, Element>();
  const duplicateNodeIds = new Set<string>();

  visualSceneNodes.forEach((node) => {
    const entry = createNodeMapEntry(node, "visual_scene");

    if (entryById.has(entry.id)) duplicateNodeIds.add(entry.id);

    if (!entryById.has(entry.id)) {
      entryById.set(entry.id, entry);
    }

    if (!elementById.has(entry.id)) {
      elementById.set(entry.id, node);
    }
  });

  libraryNodes.forEach((node) => {
    const entry = createNodeMapEntry(node, "library_nodes");

    if (entryById.has(entry.id)) duplicateNodeIds.add(entry.id);

    if (!entryById.has(entry.id)) {
      entryById.set(entry.id, entry);
    }

    if (!elementById.has(entry.id)) {
      elementById.set(entry.id, node);
    }
  });

  return {
    allNodes,
    visualSceneNodes,
    libraryNodes,
    entryById,
    elementById,
    duplicateNodeIds: Array.from(duplicateNodeIds),
  };
}

function resolveNode(
  node: Element,
  context: {
    elementById: Map<string, Element>;
    links: DaeInstanceNodeLink[];
    visitedInstanceTargets: Set<string>;
  },
  parentId: string | null = null,
  depth = 0
): DaeResolvedNode {
  const name = getNodeName(node);
  const id = getNodeId(node);

  const result: DaeResolvedNode = {
    id,
    name,
    type: "node",
    matrix: readMatrix(node),
    parentId,
    depth,
    children: [],
  };

  getDirectInstanceNodeChildren(node).forEach((instance) => {
    const url = instance.getAttribute("url") || "";
    const targetId = cleanUrlId(url);
    const targetNode = targetId ? context.elementById.get(targetId) : undefined;
    const instanceName = instance.getAttribute("name") || targetNode?.getAttribute("name") || "Instance Node";
    const targetFound = Boolean(targetNode);

    const link: DaeInstanceNodeLink = {
      parentId: id,
      parentName: name,
      instanceName,
      url,
      targetId,
      targetFound,
      targetName: targetNode ? getNodeName(targetNode) : undefined,
      targetHasMatrix: targetNode ? Boolean(readMatrix(targetNode)) : undefined,
      parentHasMatrix: Boolean(result.matrix),
      depth,
    };

    context.links.push(link);

    const instanceNode: DaeResolvedNode = {
      id: targetId || "instance_node",
      name: instanceName,
      type: "instance_node",
      url: url || undefined,
      targetId,
      targetFound,
      parentId: id,
      depth: depth + 1,
      children: [],
    };

    if (targetNode && !context.visitedInstanceTargets.has(`${id}->${targetId}`)) {
      context.visitedInstanceTargets.add(`${id}->${targetId}`);
      instanceNode.children.push(
        resolveNode(targetNode, context, targetId || id, depth + 2)
      );
    }

    result.children.push(instanceNode);
  });

  getDirectGeometryChildren(node).forEach((geo) => {
    const url = geo.getAttribute("url") || "";
    const targetId = cleanUrlId(url);

    result.children.push({
      id: targetId || "geometry",
      name: geo.getAttribute("name") || targetId || "Geometry",
      type: "geometry",
      url: url || undefined,
      targetId,
      targetFound: Boolean(targetId),
      parentId: id,
      depth: depth + 1,
      children: [],
    });
  });

  getDirectNodeChildren(node).forEach((child) => {
    result.children.push(resolveNode(child, context, id, depth + 1));
  });

  return result;
}

function buildInstanceTargetUsage(links: DaeInstanceNodeLink[]): DaeInstanceTargetUsage[] {
  const usageByTarget = new Map<string, DaeInstanceTargetUsage>();

  links.forEach((link) => {
    if (!link.targetId) return;

    const current = usageByTarget.get(link.targetId) || {
      targetId: link.targetId,
      targetName: link.targetName,
      usageCount: 0,
      parentIds: [],
      parentNames: [],
      instanceNames: [],
    };

    current.usageCount += 1;

    if (!current.parentIds.includes(link.parentId)) {
      current.parentIds.push(link.parentId);
    }

    if (!current.parentNames.includes(link.parentName)) {
      current.parentNames.push(link.parentName);
    }

    if (!current.instanceNames.includes(link.instanceName)) {
      current.instanceNames.push(link.instanceName);
    }

    usageByTarget.set(link.targetId, current);
  });

  return Array.from(usageByTarget.values()).sort((a, b) => b.usageCount - a.usageCount);
}

function getDuplicateTargetIds(targetUsage: DaeInstanceTargetUsage[]) {
  return targetUsage
    .filter((usage) => usage.usageCount > 1)
    .map((usage) => usage.targetId);
}

function getMultiUseTargetIds(targetUsage: DaeInstanceTargetUsage[]) {
  return targetUsage
    .filter((usage) => usage.parentIds.length > 1 || usage.usageCount > 1)
    .map((usage) => usage.targetId);
}

function getMaxDepth(nodes: DaeResolvedNode[]): number {
  let maxDepth = 0;

  const walk = (node: DaeResolvedNode) => {
    maxDepth = Math.max(maxDepth, node.depth || 0);
    node.children.forEach(walk);
  };

  nodes.forEach(walk);
  return maxDepth;
}

export function resolveDaeHierarchy(daeText: string): DaeHierarchyResult {
  const parser = new DOMParser();
  const xml = parser.parseFromString(daeText, "application/xml");

  const parseError = xml.querySelector("parsererror");
  if (parseError) {
    throw new Error("DAE non valido: errore parsing XML.");
  }

  const visualScene = xml.querySelector("library_visual_scenes visual_scene");
  const {
    allNodes,
    visualSceneNodes,
    libraryNodes,
    entryById,
    elementById,
    duplicateNodeIds,
  } = buildNodeMaps(xml);

  const context = {
    elementById,
    links: [] as DaeInstanceNodeLink[],
    visitedInstanceTargets: new Set<string>(),
  };

  const rootNodes = Array.from(visualScene?.querySelectorAll(":scope > node") || []).map((node) =>
    resolveNode(node, context)
  );

  const instanceNodeCount = xml.querySelectorAll("instance_node").length;
  const geometryCount = xml.querySelectorAll("instance_geometry").length;
  const nodeCount = xml.querySelectorAll("node").length;
  const uniqueLinks = Array.from(
    new Map(
      context.links.map((link) => [
        `${link.parentId}|${link.targetId}|${link.url}`,
        link,
      ])
    ).values()
  );

  const resolvedInstanceLinks = uniqueLinks.filter((link) => link.targetFound);
  const unresolvedInstanceLinks = uniqueLinks.filter((link) => !link.targetFound);
  const instanceTargetUsage = buildInstanceTargetUsage(uniqueLinks);
  const duplicateTargetIds = getDuplicateTargetIds(instanceTargetUsage);
  const multiUseTargetIds = getMultiUseTargetIds(instanceTargetUsage);
  const nodeMap = Array.from(entryById.values());
  const warnings: string[] = [];

  if (instanceNodeCount > 0) {
    warnings.push("DAE usa instance_node: serve ricostruzione gerarchia prima del GLB.");
  }

  if (resolvedInstanceLinks.length > 0) {
    warnings.push(`DAE instance_node risolti: ${resolvedInstanceLinks.length}/${instanceNodeCount}.`);
  }

  if (unresolvedInstanceLinks.length > 0) {
    warnings.push(`DAE instance_node non risolti: ${unresolvedInstanceLinks.length}.`);
  }

  if (duplicateNodeIds.length > 0) {
    warnings.push(`DAE contiene ID nodo duplicati: ${duplicateNodeIds.length}.`);
  }

  if (duplicateTargetIds.length > 0) {
    warnings.push(`DAE target instance_node riutilizzati: ${duplicateTargetIds.length}.`);
  }

  if (multiUseTargetIds.length > 0) {
    warnings.push(`DAE target multi-uso da ricostruire: ${multiUseTargetIds.length}.`);
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
    diagnostics: {
      nodeMap,
      libraryNodeMap: nodeMap.filter((entry) => entry.source === "library_nodes"),
      visualSceneNodeMap: nodeMap.filter((entry) => entry.source === "visual_scene"),
      resolvedInstanceLinks,
      unresolvedInstanceLinks,
      instanceTargetUsage,
      duplicateTargetIds,
      multiUseTargetIds,
      duplicateNodeIds,
      nodesWithMatrixCount: allNodes.filter((node) => Boolean(readMatrix(node))).length,
      libraryNodesCount: libraryNodes.length,
      visualSceneRootCount: Array.from(visualScene?.querySelectorAll(":scope > node") || []).length,
      maxDepth: getMaxDepth(rootNodes),
    },
  };
}
