"use client";

import { useMemo, useState } from "react";
import ComponentSearch from "./ComponentSearch";
import ModuleTree from "./ModuleTree";
import type { ComponentRowRefs, RuntimeComponent } from "./types";
import { buildComponentModules, componentMatchesSearch } from "./componentExplorerUtils";

type ComponentExplorerProps = {
  components: RuntimeComponent[];
  selectedPartId: string | null;
  selectedPartIds: string[];
  rowRefs: ComponentRowRefs;
  onClear: () => void;
  onSelectComponent: (component: RuntimeComponent, componentId: string, wantsMultiSelect: boolean) => void;
};

export default function ComponentExplorer({
  components,
  selectedPartId,
  selectedPartIds,
  rowRefs,
  onClear,
  onSelectComponent,
}: ComponentExplorerProps) {
  const [search, setSearch] = useState("");
  const [closedModuleIds, setClosedModuleIds] = useState<string[]>([]);

  const filteredComponents = useMemo(
    () => components.filter((component) => componentMatchesSearch(component, search)),
    [components, search]
  );

  const modules = useMemo(() => buildComponentModules(filteredComponents), [filteredComponents]);
  const openModuleIds = useMemo(
    () => modules.map((module) => module.id).filter((moduleId) => !closedModuleIds.includes(moduleId)),
    [modules, closedModuleIds]
  );

  const toggleModule = (moduleId: string) => {
    setClosedModuleIds((current) =>
      current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId]
    );
  };

  return (
    <section className="max-h-[360px] shrink-0 overflow-hidden rounded-[24px] border border-cyan-400/20 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
            Component Explorer
          </h2>
          <p className="text-xs font-semibold text-white">
            {components.length} pezzi · {modules.length} moduli
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-neutral-200 hover:border-sky-400 hover:text-white"
          onClick={onClear}
        >
          Pulisci
        </button>
      </div>

      <ComponentSearch
        value={search}
        onChange={setSearch}
        totalCount={components.length}
        visibleCount={filteredComponents.length}
      />

      <div className="mt-3 max-h-[220px] overflow-auto pr-1">
        <ModuleTree
          modules={modules}
          openModuleIds={openModuleIds}
          selectedPartId={selectedPartId}
          selectedPartIds={selectedPartIds}
          rowRefs={rowRefs}
          onToggleModule={toggleModule}
          onSelect={onSelectComponent}
        />
      </div>
    </section>
  );
}
