"use client";

import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useStorage,
} from "@liveblocks/react";
import {
  colorToCss,
  findIntersectionLayersWithRectangle,
  pointerEventToCanvasPoint,
  resizeBounds,
} from "~/utils";
import LayerComponent from "./LayerComponent";
import {
  Camera,
  CanvasMode,
  CanvasState,
  Layer,
  LayerType,
  Point,
  Side,
  XYWH,
} from "~/types";
import type { Anchor, EntityLayer, RelationLayer } from "~/types";
import { nanoid } from "nanoid";
import { LiveObject } from "@liveblocks/client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ToolsBar from "../toolsbar/ToolsBar";
import SelectionBox from "./SelectionBox";
import useDeleteLayers from "~/hooks/useDeleteLayers";
import SelectionTools from "./SelectionTools";
import Sidebars from "../sidebars/Sidebars";
import MultiplayerGuides from "./MultiplayerGuides";
import { User } from "@prisma/client";
import { useAngularProjectGenerator } from "../angular-generator/useAngularProjectGenerator";

import { useSpringBootGenerator } from "../spring-generator/useSpringBootGenerator";
import { usePostmanCollectionGenerator } from "../spring-generator/usePostmanCollectionGenerator";

// dentro del bloque de botones de la barra superior en Canvas.tsx
import  useNlToErd  from "../ai/useNlToErd"; // 👈 importa el hook (ajusta ruta si difiere)
import NlToErdModal from "~/components/ai/NlToErdModal";


import { useClassDiagramToFormsGenerator } from "~/hooks/useClassDiagramToFormsGenerator";

/* =========================================================
 * Helpers de tipado / guards para evitar "as any"
 * =======================================================*/
const isPressing = (s: CanvasState): s is CanvasState & { origin: Point } =>
  s.mode === CanvasMode.Pressing && "origin" in s;

const isDragging = (s: CanvasState): s is CanvasState & { origin: Point | null } =>
  s.mode === CanvasMode.Dragging && "origin" in s;

const isTranslating = (s: CanvasState): s is CanvasState & { current: Point } =>
  s.mode === CanvasMode.Translating && "current" in s;

const isResizing = (
  s: CanvasState,
): s is CanvasState & { initialBounds: XYWH; corner: Side } =>
  s.mode === CanvasMode.Resizing && "initialBounds" in s && "corner" in s;

const isSelectionNet = (
  s: CanvasState,
): s is CanvasState & { origin: Point; current: Point } =>
  s.mode === CanvasMode.SelectionNet && "origin" in s && "current" in s;

const isLinking = (
  s: CanvasState,
): s is CanvasState & {
  fromEntityId: string;
  fromAnchor: "L" | "R" | "T" | "B";
  current?: Point;
} =>
  s.mode === CanvasMode.Linking &&
  "fromEntityId" in s &&
  "fromAnchor" in s;

/* =========================================================
 * Utils locales
 * =======================================================*/
function asLiveEntity(layer: any): LiveObject<EntityLayer> | null {
  const t = layer?.get?.("type");
  return t === LayerType.Entity ? (layer as LiveObject<EntityLayer>) : null;
}

function getAnchorPoint(e: EntityLayer, a: "L" | "R" | "T" | "B") {
  const midY = e.y + e.height / 2;
  const midX = e.x + e.width / 2;
  switch (a) {
    case "L":
      return { x: e.x, y: midY };
    case "R":
      return { x: e.x + e.width, y: midY };
    case "T":
      return { x: midX, y: e.y };
    case "B":
      return { x: midX, y: e.y + e.height };
  }
}

/* =========================================================
 * Componente
 * =======================================================*/
export default function Canvas({
  roomName,
  roomId,
  othersWithAccessToRoom,
}: {
  roomName: string;
  roomId: string;
  othersWithAccessToRoom: User[];
}) {
  const generateAngularProject = useAngularProjectGenerator(roomName);

  //!yo añadi esta línea -----------------------------------------
  const generateSpringBoot = useSpringBootGenerator(roomName);
  const generatePostman = usePostmanCollectionGenerator(roomName);
  const { fromDescription } = useNlToErd(); 


  const [leftIsMinimized, setLeftIsMinimized] = useState(false);
  const roomColor = useStorage((root) => root.roomColor);
  const layerIds = useStorage((root) => root.layerIds);
  const deleteLayers = useDeleteLayers();

  const [canvasState, setState] = useState<CanvasState>({ mode: CanvasMode.None });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const classDiagramFileInputRef = useRef<HTMLInputElement>(null);


  //!---------------------------------------------------------
    async function handleDescribeToErd() {
    const defaultText =
      "Una Persona tiene muchas Casas y cada Casa pertenece a un Condominio";
    const prompt = window.prompt("Describe tu diagrama (NL → ERD)", defaultText);
    if (!prompt) return;

    try {
      // Si quieres reemplazar todo lo existente, usa { replace: true }
      await fromDescription(prompt, { replace: false });
    } catch (e: any) {
      alert(e?.message || "No se pudo generar el ERD");
    }
  }
  //!---------------------------------------------------------

  /* =========================================================
   * Acciones: seleccionar, exportar, importar
   * =======================================================*/
  const selectAllLayers = useMutation(
    ({ setMyPresence }) => {
      if (layerIds) {
        setMyPresence({ selection: [...layerIds] }, { addToHistory: true });
      }
    },
    [layerIds],
  );

  const exportToJSON = useMutation(
    ({ storage }) => {
      const layers = storage.get("layers").toImmutable();
      const layerIdsArray = storage.get("layerIds").toImmutable();
      const canvasColor = storage.get("roomColor");

      const layersObject: Record<string, any> = {};
      layers.forEach((layer, id) => {
        layersObject[id] = JSON.parse(JSON.stringify(layer));
      });

      const canvasData = {
        layers: layersObject,
        layerIds: layerIdsArray,
        roomColor: canvasColor,
        exportedAt: new Date().toISOString(),
        name: roomName,
      };

      const jsonString = JSON.stringify(canvasData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${roomName.replace(/\s+/g, "_")}_canvas_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [roomName],
  );

  const importFromJSON = useMutation(
    ({ storage, setMyPresence }, jsonData: any) => {
      try {
        if (!jsonData.layers || !jsonData.layerIds) {
          throw new Error("Invalid JSON format: missing layers or layerIds");
        }
        const liveLayers = storage.get("layers");
        const liveLayerIds = storage.get("layerIds");

        // limpiar
        for (let i = liveLayerIds.length - 1; i >= 0; i--) liveLayerIds.delete(i);
        const existing = [...liveLayers.keys()];
        existing.forEach((id) => liveLayers.delete(id));

        if (jsonData.roomColor) storage.set("roomColor", jsonData.roomColor);

        // restaurar
        Object.entries(jsonData.layers).forEach(([id, layerData]) => {
          liveLayers.set(id, new LiveObject(layerData as Layer));
        });
        jsonData.layerIds.forEach((id: string) => liveLayerIds.push(id));

        setMyPresence({ selection: [] });
        setState({ mode: CanvasMode.None });
      } catch (e) {
        console.error("Error importing JSON:", e);
        alert("Error importing file. Please check the file format.");
      }
    },
    [],
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(String(e.target?.result));
          importFromJSON(jsonData);
        } catch (err) {
          console.error("Error parsing JSON file:", err);
          alert("Invalid JSON file format");
        } finally {
          event.target.value = "";
        }
      };
      reader.readAsText(file);
    },
    [importFromJSON],
  );

  /* =========================================================
   * Generador desde diagrama (se mantiene igual)
   * =======================================================*/
  const {
    generateFormsFromDiagram,
    isProcessing: isProcessingClassDiagram,
    error: classDiagramError,
  } = useClassDiagramToFormsGenerator(importFromJSON);

  const handleGenerateFormsClick = () => classDiagramFileInputRef.current?.click();
  const handleClassDiagramFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      generateFormsFromDiagram(file);
      e.target.value = "";
    }
  };

  /* =========================================================
   * Atajos de teclado (undo/redo, export/import, etc.)
   * =======================================================*/
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      const isInput = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (isInput) return;

      switch (e.key) {
        case "Backspace":
          deleteLayers();
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) e.shiftKey ? history.redo() : history.undo();
          break;
        case "a":
          if (e.ctrlKey || e.metaKey) selectAllLayers();
          break;
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            exportToJSON();
          }
          break;
        case "o":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deleteLayers, exportToJSON, selectAllLayers, history]);

  /* =========================================================
   * Linking
   * =======================================================*/
  const startLinking = useCallback(
    (entityId: string, anchor: "L" | "R" | "T" | "B") => {
      setState({ mode: CanvasMode.Linking, fromEntityId: entityId, fromAnchor: anchor });
    },
    [],
  );

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence, storage }, e: React.PointerEvent, layerId: string) => {
      if (isLinking(canvasState)) {
        e.stopPropagation();

        // mismo origen -> sigue en linking
        if (layerId === canvasState.fromEntityId) return;

        const layers = storage.get("layers");
        const src = layers.get(canvasState.fromEntityId);
        const dst = layers.get(layerId);
        const isEntity = (l: any) => l?.get?.("type") === LayerType.Entity;

        if (isEntity(src) && isEntity(dst)) {
          const id = nanoid();
          layers.set(
            id,
            new LiveObject({
              type: LayerType.Relation,
              sourceId: canvasState.fromEntityId,
              targetId: layerId,
              sourceCard: "ONE",
              targetCard: "ONE",
              owningSide: "target",
              opacity: 100,
            } as RelationLayer),
          );
          storage.get("layerIds").push(id);

          setState({ mode: CanvasMode.None });
        }
        return; // si no es entidad, sigue en Linking
      }

      if (canvasState.mode === CanvasMode.Inserting) return;

      history.pause();
      e.stopPropagation();

      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }

      if (e.nativeEvent.button === 2) {
        setState({ mode: CanvasMode.RightClick });
      } else {
        const point = pointerEventToCanvasPoint(e, camera);
        setState({ mode: CanvasMode.Translating, current: point });
      }
    },
    [camera, canvasState, history],
  );

  /* =========================================================
   * Mutations de edición (insert, translate, resize)
   * =======================================================*/
  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      setState({ mode: CanvasMode.Resizing, initialBounds, corner });
    },
    [history],
  );

  const insertEntity = useMutation(
    ({ storage, setMyPresence }, position: Point) => {
      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");
      const id = nanoid();

      const entity: EntityLayer = {
        type: LayerType.Entity,
        x: position.x,
        y: position.y,
        width: 240,
        height: 140,
        name: "NuevaEntidad",
        attributes: [
          { id: nanoid(), name: "id", type: "long", required: true, pk: true },
          { id: nanoid(), name: "nombre", type: "string" },
        ],
        opacity: 100,
      };

      liveLayers.set(id, new LiveObject(entity));
      liveLayerIds.push(id);
      setMyPresence({ selection: [id] }, { addToHistory: true });
      setState({ mode: CanvasMode.None });
    },
    [],
  );

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (!isTranslating(canvasState)) return;

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      };

      const liveLayers = storage.get("layers");
      for (const id of self.presence.selection) {
        const anyLayer = liveLayers.get(id);
        const layer = asLiveEntity(anyLayer);
        if (!layer) continue;
        const x = (layer.get("x") as number) ?? 0;
        const y = (layer.get("y") as number) ?? 0;
        layer.update({ x: x + offset.x, y: y + offset.y });
      }
      setState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState],
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (!isResizing(canvasState)) return;

      const bounds = resizeBounds(canvasState.initialBounds, canvasState.corner, point);
      const liveLayers = storage.get("layers");
      if (self.presence.selection.length > 0) {
        const anyLayer = liveLayers.get(self.presence.selection[0]!);
        const layer = asLiveEntity(anyLayer);
        if (layer) layer.update(bounds);
      }
    },
    [canvasState],
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  /* =========================================================
   * Eventos de canvas (wheel, pointer*)
   * =======================================================*/
  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
      zoom: camera.zoom,
    }));
  }, []);

  const onPointerDown = useMutation(
    ({}, e: React.PointerEvent) => {
      // no salir de Linking por click en fondo
      if (isLinking(canvasState)) return;

      const point = pointerEventToCanvasPoint(e, camera);
      if (isDragging(canvasState)) {
        setState({ mode: CanvasMode.Dragging, origin: point });
        return;
      }
      if (canvasState.mode === CanvasMode.Inserting) return;
      setState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState, setState],
  );

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setState({ mode: CanvasMode.SelectionNet, origin, current });
    }
  }, []);

  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      if (!layerIds) return;
      const layers = storage.get("layers").toImmutable();
      setState({ mode: CanvasMode.SelectionNet, origin, current });
      const ids = findIntersectionLayersWithRectangle(layerIds, layers, origin, current);
      setMyPresence({ selection: ids });
    },
    [layerIds],
  );

  // arriba del componente (o fuera):
type LinkingState = Extract<CanvasState, { mode: CanvasMode.Linking }>;
const isLinkingState = (s: CanvasState): s is LinkingState =>
  s.mode === CanvasMode.Linking;


  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (isPressing(canvasState)) {
        startMultiSelection(point, canvasState.origin);
      } else if (isSelectionNet(canvasState)) {
        updateSelectionNet(point, canvasState.origin);
      } else if (isDragging(canvasState) && canvasState.origin !== null) {
        const { movementX, movementY } = e;
        setCamera((c) => ({ x: c.x + movementX, y: c.y + movementY, zoom: c.zoom }));
      } else if (isTranslating(canvasState)) {
        translateSelectedLayers(point);
      } else if (isResizing(canvasState)) {
        resizeSelectedLayer(point);
      } else if (canvasState.mode === CanvasMode.Linking) {
        setState(prev =>
          isLinkingState(prev) ? { ...prev, current: point } : prev
        );
      }

      setMyPresence({ cursor: point });
    },
    [camera, canvasState, translateSelectedLayers, resizeSelectedLayer, updateSelectionNet, startMultiSelection],
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerUp = useMutation(
    ({}, e: React.PointerEvent) => {
      if (canvasState.mode === CanvasMode.RightClick) return;
      if (isLinking(canvasState)) return; // no cancelar Linking con up del fondo

      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.None || isPressing(canvasState)) {
        unselectLayers();
        setState({ mode: CanvasMode.None });
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertEntity(point);
      } else if (isDragging(canvasState)) {
        setState({ mode: CanvasMode.Dragging, origin: null });
      } else {
        setState({ mode: CanvasMode.None });
      }
      history.resume();
    },
    [canvasState, setState, unselectLayers, history],
  );

  /* =========================================================
   * Linking preview
   * =======================================================*/
  const linkingSource = useStorage((root) =>
    isLinking(canvasState)
      ? (root.layers.get(canvasState.fromEntityId) as EntityLayer | undefined)
      : undefined,
  );

  const linkingPreview =
    isLinking(canvasState) && canvasState.current && linkingSource
      ? (() => {
          const p1 = getAnchorPoint(linkingSource, canvasState.fromAnchor);
          const p2 = canvasState.current;
          return (
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#3b82f6"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              pointerEvents="none"
            />
          );
        })()
      : null;

  /* =========================================================
   * Selection net
   * =======================================================*/
  const selectionNetRect =
    isSelectionNet(canvasState) ? (
      <rect
        className="fill-blue-600/5 stroke-blue-600 stroke-[0.5]"
        x={Math.min(canvasState.origin.x, canvasState.current.x)}
        y={Math.min(canvasState.origin.y, canvasState.current.y)}
        width={Math.abs(canvasState.origin.x - canvasState.current.x)}
        height={Math.abs(canvasState.origin.y - canvasState.current.y)}
      />
    ) : null;

  /* =========================================================
   * Render
   * =======================================================*/
  return (
    <div className="flex h-screen w-full">
      <main className="fixed left-0 right-0 h-screen overflow-y-auto">
        {/* input oculto: diagrama de clases */}
        <input
          type="file"
          ref={classDiagramFileInputRef}
          onChange={handleClassDiagramFileChange}
          accept="image/*"
          style={{ display: "none" }}
        />

        {/* barra superior */}
        <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 transform flex-wrap items-center justify-center gap-2 rounded-xl bg-white/90 px-5 py-3 shadow-lg backdrop-blur-md">
          <button
            onClick={exportToJSON}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white shadow hover:bg-blue-700"
          >
            Exportar a JSON
          </button>

          <label className="relative cursor-pointer rounded-md bg-green-600 px-4 py-2 text-sm text-white shadow hover:bg-green-700">
            Importar JSON
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>

          <NlToErdModal
            defaultValue="Una Persona tiene muchas Casas y cada Casa pertenece a un Condominio"
            trigger={
              <button
                type="button"
                className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white shadow hover:bg-purple-700"
                title="Describe y te dibujo (NL → ERD)"
              >
                ✨ Describe y te dibujo
              </button>
            }
          />


          <button
          onClick={generateSpringBoot}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white shadow hover:bg-emerald-700"
        >
          Generar Spring
        </button>

        <button
          onClick={generatePostman}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white shadow hover:bg-orange-700
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
        >
          Exportar Postman
        </button>

      
        {/* <button
          onClick={handleDescribeToErd}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white shadow hover:bg-purple-700"
        >
          Describe → ERD
        </button> */}



 
        </div>

        {/* lienzo */}
        <div
          style={{ backgroundColor: roomColor ? colorToCss(roomColor) : "#1e1e1e" }}
          className="h-full w-full touch-none"
        >
          <SelectionTools camera={camera} canvasMode={canvasState.mode} />
          <svg
            className={`h-full w-full ${isLinking(canvasState) ? "linking" : ""}`}
            onWheel={onWheel}
            onPointerUp={onPointerUp}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onContextMenu={(e) => e.preventDefault()}
          >
            <g
              style={{
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
              }}
            >
              {layerIds?.map((layerId) => (
                <LayerComponent
                  key={layerId}
                  id={layerId}
                  onLayerPointerDown={onLayerPointerDown}
                  onStartLink={startLinking}
                />
              ))}

              {linkingPreview}
              <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
              {selectionNetRect}
              <MultiplayerGuides />
            </g>
          </svg>

          {/* Mientras linkeas, no bloquees clics con foreignObject ni texto */}
          <style jsx global>{`
            svg.linking foreignObject {
              pointer-events: none !important;
            }
            svg.linking g.relation {
              pointer-events: none !important;
            }
            svg:not(.linking) g.entity .entity-hit {
              pointer-events: none !important;
            }
            svg.linking g.entity .entity-hit {
              pointer-events: all !important;
            }
            svg.linking text,
            svg.linking tspan {
              pointer-events: none !important;
            }
          `}</style>
        </div>
      </main>

      <ToolsBar
        canvasState={canvasState}
        setCanvasState={(s) => setState(s)}
        zoomIn={() => setCamera((c) => ({ ...c, zoom: c.zoom + 0.1 }))}
        zoomOut={() => setCamera((c) => ({ ...c, zoom: c.zoom - 0.1 }))}
        canZoomIn={camera.zoom < 2}
        canZoomOut={camera.zoom > 0.5}
        redo={() => history.redo()}
        undo={() => history.undo()}
        canRedo={canRedo}
        canUndo={canUndo}
      />

      <Sidebars
        roomName={roomName}
        roomId={roomId}
        othersWithAccessToRoom={othersWithAccessToRoom}
        leftIsMinimized={leftIsMinimized}
        setLeftIsMinimized={setLeftIsMinimized}
      />
    </div>
  );
}
