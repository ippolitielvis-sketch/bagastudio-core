"use client";

import type { ComponentExplorerModule, ComponentRowRefs, RuntimeComponent } from "./types";
import ModuleNode from "./ModuleNode";

type ModuleTreeProps = {
  modules: ComponentExplorerModule[];
  openModuleIds: string[];
  selectedPartId: string | null;
  selectedPartIds: string[];
  rowRefs: ComponentRowRefs;
  onToggleModule: (moduleId: string) => void;
  onSelect: (component: RuntimeComponent, componentId: string, wantsMultiSelect: boolean) => void;
};

export default function ModuleTree({
  modules,
  openModuleIds,
  selectedPartId,
  selectedPartIds,
  rowRefs,
  onToggleModule,
  onSelect,
}: ModuleTreeProps) {
  if (!modules.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-neutral-400">
        Nessun componente runtime rilevato.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {modules.map((module) => (
        <ModuleNode
          key={module.id}
          module={module}
          isOpen={openModuleIds.includes(module.id)}
          selectedPartId={selectedPartId}
          selectedPartIds={selectedPartIds}
          rowRefs={rowRefs}
          onToggle={onToggleModule}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
