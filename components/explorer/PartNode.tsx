"use client";

import type { ComponentRowRefs, RuntimeComponent } from "./types";
import { getComponentAliases, getComponentId, getComponentLabel } from "./componentExplorerUtils";

type PartNodeProps = {
  component: RuntimeComponent;
  selectedPartId: string | null;
  selectedPartIds: string[];
  rowRefs: ComponentRowRefs;
  onSelect: (component: RuntimeComponent, componentId: string, wantsMultiSelect: boolean) => void;
};

export default function PartNode({ component, selectedPartId, selectedPartIds, rowRefs, onSelect }: PartNodeProps) {
  const componentId = getComponentId(component);
  const aliases = getComponentAliases(component);
  const isSelected = aliases.some((alias) => selectedPartIds.includes(alias) || selectedPartId === alias);
  const label = getComponentLabel(component, componentId);

  if (!componentId) return null;

  return (
    <button
      type="button"
      ref={(node) => {
        rowRefs.current[componentId] = node;
        aliases.forEach((alias) => {
          rowRefs.current[alias] = node;
        });
      }}
      className={`group w-full rounded-2xl border px-3 py-2 text-left transition ${
        isSelected
          ? "border-sky-300/80 bg-sky-500/20 text-white shadow-[0_0_24px_rgba(14,165,233,0.14)]"
          : "border-white/10 bg-white/[0.045] text-neutral-300 hover:border-sky-400/50 hover:bg-sky-500/10 hover:text-white"
      }`}
      onClick={(event) => onSelect(component, componentId, event.ctrlKey || event.metaKey || event.shiftKey)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-black">{label}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${isSelected ? "bg-sky-300/20 text-sky-100" : "bg-white/10 text-neutral-400"}`}>
          #{component.index ?? "-"}
        </span>
      </div>
      <div className="mt-1 truncate text-[10px] font-semibold text-neutral-500 group-hover:text-neutral-300">
        {component.meshName || component.partId || component.id}
      </div>
    </button>
  );
}
