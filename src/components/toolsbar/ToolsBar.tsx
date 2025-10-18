import { CanvasMode, CanvasState, LayerType, RelationType } from "~/types";
import { useState } from "react";
import SelectionButton from "./SelectionButton";
import ZoomInButton from "./ZoomInButton";
import ZoomOutButton from "./ZoomOutButton";
import UndoButton from "./UndoButton";
import RedoButton from "./RedoButton";

export default function ToolsBar({
  canvasState,
  setCanvasState,
  selectedRelationType,
  setSelectedRelationType,
  zoomIn,
  zoomOut,
  canZoomIn,
  canZoomOut,
  canUndo,
  canRedo,
  undo,
  redo,
}: {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  selectedRelationType: RelationType;
  setSelectedRelationType: (type: RelationType) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  const isInsertEntityActive =
    canvasState.mode === CanvasMode.Inserting &&
    canvasState.layerType === LayerType.Entity;

  const handleInsertEntity = () =>
    setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Entity });

  const [isRelationDropdownOpen, setIsRelationDropdownOpen] = useState(false);

  const relationTypeOptions: Array<{ value: RelationType; label: string; icon: React.ReactNode }> = [
    {
      value: "association",
      label: "Asociación",
      icon: (
        <svg width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <line x1="2" y1="10" x2="38" y2="10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    },
    {
      value: "aggregation",
      label: "Agregación",
      icon: (
        <svg width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <line x1="12" y1="10" x2="38" y2="10" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="2,10 7,6 12,10 7,14" stroke="currentColor" strokeWidth="1.5" fill="white" />
        </svg>
      )
    },
    {
      value: "composition",
      label: "Composición",
      icon: (
        <svg width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <line x1="12" y1="10" x2="38" y2="10" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="2,10 7,6 12,10 7,14" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
        </svg>
      )
    },
    {
      value: "generalization",
      label: "Herencia",
      icon: (
        <svg width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <line x1="2" y1="10" x2="32" y2="10" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="32,6 38,10 32,14" fill="white" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      value: "realization",
      label: "Implementación",
      icon: (
        <svg width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <line x1="2" y1="10" x2="32" y2="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3, 2" />
          <polygon points="32,6 38,10 32,14" fill="white" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      value: "dependency",
      label: "Dependencia",
      icon: (
        <svg width="40" height="20" viewBox="0 0 40 20" role="img" aria-label="UML Dependencia" className="flex-shrink-0">
          <defs>
            <marker id="uml-vee-open-toolbar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10" fill="none" stroke="currentColor" strokeWidth="2"/>
            </marker>
          </defs>
          <line x1="2" y1="10" x2="34" y2="10" stroke="currentColor" strokeWidth="1.5"
                strokeDasharray="3 2" markerEnd="url(#uml-vee-open-toolbar)"
                vectorEffect="non-scaling-stroke" strokeLinecap="round"/>
        </svg>
      )
    },
  ];

  const selectedOption = relationTypeOptions.find(opt => opt.value === selectedRelationType);
  const selectedLabel = selectedOption?.label || "";
  const selectedIcon = selectedOption?.icon;

  return (
    <div className="fixed bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-2xl bg-white px-4 py-3 shadow-xl border border-gray-200">
      <div className="flex items-center justify-center gap-4">
        {/* Selección */}
        <SelectionButton
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Resizing ||
            canvasState.mode === CanvasMode.Dragging
          }
          canvasMode={canvasState.mode}
          onClick={(canvasMode) =>
            setCanvasState(
              canvasMode === CanvasMode.Dragging
                ? { mode: canvasMode, origin: null }
                : { mode: canvasMode },
            )
          }
        />

        {/* Insertar ENTIDAD */}
        <button
          type="button"
          title="Insertar Clase (C)"
          onClick={handleInsertEntity}
          className={`flex items-center gap-2 h-9 rounded-lg px-3.5 text-sm font-medium transition-all ${
            isInsertEntityActive
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Clase
        </button>

        <div className="h-8 w-px bg-gray-300" />

        {/* Selector de Tipo de Relación */}
        <div className="relative flex items-center gap-2.5">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relación:</span>
          <button
            onClick={() => setIsRelationDropdownOpen(!isRelationDropdownOpen)}
            className="flex h-9 items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-all hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            title="Selecciona el tipo de relación UML"
          >
            {selectedIcon && <span className="flex-shrink-0">{selectedIcon}</span>}
            <span>{selectedLabel}</span>
            <svg
              className={`h-4 w-4 flex-shrink-0 transition-transform ${isRelationDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isRelationDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsRelationDropdownOpen(false)}
              />
              <div className="absolute bottom-full left-0 z-20 mb-2 w-64 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                {relationTypeOptions.map((option) => {
                  const isSelected = option.value === selectedRelationType;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedRelationType(option.value);
                        setIsRelationDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        isSelected ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700"
                      }`}
                    >
                      <span className="flex-shrink-0">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-gray-300" />

        {/* Undo / Redo */}
        <div className="flex items-center justify-center">
          <UndoButton onClick={undo} disabled={!canUndo} />
          <RedoButton onClick={redo} disabled={!canRedo} />
        </div>

        <div className="w-[1px] self-stretch bg-black/10" />

        {/* Zoom */}
        <div className="flex items-center justify-center">
          <ZoomInButton onClick={zoomIn} disabled={!canZoomIn} />
          <ZoomOutButton onClick={zoomOut} disabled={!canZoomOut} />
        </div>
      </div>
    </div>
  );
}
