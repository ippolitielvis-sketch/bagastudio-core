"use client";

import type { ComponentExplorerModule, ComponentRowRefs, RuntimeComponent } from "./types";
import PartNode from "./PartNode";

type ModuleNodeProps = {
  module: ComponentExplorerModule;
  isOpen: boolean;
  selectedPartId: string | null;
  selectedPartIds: string[];
  rowRefs: ComponentRowRefs;
  onToggle: (moduleId: string) => void;
  onSelect: (component: RuntimeComponent, componentId: string, wantsMultiSelect: boolean) => void;
};

export default function ModuleNode({
  module,
  isOpen,
  selectedPartId,
  selectedPartIds,
  rowRefs,
  onToggle,
  onSelect,
}: ModuleNodeProps) {
  const selectedCount = module.components.filter((component) => {
    const aliases = [component.id, component.partId, component.meshName, component.name, component.displayName, component.originalName]
      .map((value) => String(value || ""))
      .filter(Boolean);
    return aliases.some((alias) => selectedPartIds.includes(alias) || selectedPartId === alias);
  }).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 border-b border-white/10 bg-white/[0.035] px-3 py-2.5 text-left transition hover:bg-cyan-400/10"
        onClick={() => onToggle(module.id)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cyan-200">{isOpen ? "▾" : "▸"}</span>
            <span className="truncate text-xs font-black text-white">{module.name}</span>
          </div>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{module.subtitle}</p>
        </div>
        {selectedCount > 0 && (
          <span className="shrink-0 rounded-full border border-sky-300/30 bg-sky-400/15 px-2 py-1 text-[10px] font-black text-sky-100">
            {selectedCount} sel.
          </span>
        )}
      </button>

      {isOpen && (
        <div className="space-y-1.5 p-2">
          {module.components.map((component, index) => (
            <PartNode
              key={`${module.id}-${component.id || component.partId || component.meshName || index}`}
              component={component}
              selectedPartId={selectedPartId}
              selectedPartIds={selectedPartIds}
              rowRefs={rowRefs}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
