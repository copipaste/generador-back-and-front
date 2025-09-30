// src/components/canvas/Entity.tsx
"use client";

import { memo, useRef, useState, useEffect } from "react";
import { useMutation } from "@liveblocks/react";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import type { EntityLayer } from "~/types";

type Props = {
  id: string;
  layer: EntityLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onStartLink?: (entityId: string, anchor: "L" | "R" | "T" | "B") => void;
};

const HEADER_H = 28;
const ROW_H = 20;
const PADDING = 8;

export default memo(function Entity({
  id,
  layer,
  onPointerDown,
  onStartLink,
}: Props) {
  // Estado local de edición
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);

  // --- helper: asegura que la capa en storage sea siempre LiveObject ---
  const getLiveLayer = (storage: any) => {
    const map = storage.get("layers");
    const current = map.get(id);
    if (current && typeof (current as any).update === "function") {
      return current as LiveObject<EntityLayer>;
    }
    const wrapped = new LiveObject<EntityLayer>((current ?? {}) as EntityLayer);
    map.set(id, wrapped);
    return wrapped;
  };

  // ----- Mutations Liveblocks -----
  const updateName = useMutation(({ storage }, name: string) => {
    const lo = getLiveLayer(storage);
    lo.update({ name });
  }, [id]);

  const updateAttr = useMutation(({ storage }, attrId: string, patch: any) => {
    const lo = getLiveLayer(storage);
    const attrs = (lo.get("attributes") as any[]) ?? [];
    const i = attrs.findIndex((a) => a.id === attrId);
    if (i < 0) return;
    const next = [...attrs];
    next[i] = { ...attrs[i], ...patch };
    lo.update({ attributes: next });
  }, [id]);

  const addAttr = useMutation(({ storage }) => {
    const lo = getLiveLayer(storage);
    const attrs = (lo.get("attributes") as any[]) ?? [];
    const newAttr = {
      id: nanoid(),
      name: "nuevoCampo",
      type: "string",
      required: false,
      pk: false,
    };
    lo.update({ attributes: [...attrs, newAttr] });
    setEditingAttrId(newAttr.id);
  }, [id]);

  const delAttr = useMutation(({ storage }, attrId: string) => {
    const lo = getLiveLayer(storage);
    const attrs = (lo.get("attributes") as any[]) ?? [];
    lo.update({ attributes: attrs.filter((a) => a.id !== attrId) });
    if (editingAttrId === attrId) setEditingAttrId(null);
  }, [id, editingAttrId]);

  // Helpers de edición
  const titleInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const stopAndSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // --- Render ---
  const { x, y, width, height, name, attributes } = layer;
  const bodyH = Math.max(
    height - HEADER_H,
    ROW_H * (attributes?.length ?? 0) + PADDING * 2,
  );

  // Coordenadas para handles (para relaciones)
  const midY = HEADER_H + bodyH / 2;
  const midX = width / 2;

  return (
    <g
      className="entity"
      transform={`translate(${x}, ${y})`}
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{ cursor: "move" }}
    >
      {/* cuerpo */}
      <rect
        x={0}
        y={HEADER_H}
        width={width}
        height={bodyH}
        rx={6}
        ry={6}
        fill="#FBF3C2"
        stroke="#B9B18A"
      />
      {/* header */}
      <rect
        x={0}
        y={0}
        width={width}
        height={HEADER_H}
        rx={6}
        ry={6}
        fill="#F2D06B"
        stroke="#B9B18A"
      />
      {/* título */}
      {!editingTitle ? (
        <text
          x={PADDING}
          y={HEADER_H / 2 + 4}
          fontSize={13}
          fontWeight={700}
          fill="#333"
          onDoubleClick={(e) => {
            stopAndSelect(e);
            setEditingTitle(true);
          }}
          style={{ userSelect: "none" }}
        >
          {name}
        </text>
      ) : (
        <foreignObject
          x={PADDING}
          y={4}
          width={width - PADDING * 2}
          height={HEADER_H - 8}
        >
          <input
            ref={titleInputRef}
            defaultValue={name}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              updateName(e.currentTarget.value.trim() || "Entidad");
              setEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === "Escape") {
                setEditingTitle(false);
              }
            }}
            className="w-full h-full rounded px-2 text-[13px] font-semibold outline-none"
            style={{ background: "white" }}
          />
        </foreignObject>
      )}

      {/* atributos */}
      {(attributes ?? []).map((attr, idx) => {
        const top = HEADER_H + PADDING + idx * ROW_H + 2;
        const isEditing = editingAttrId === attr.id;

        return (
          <g key={attr.id}>
            {!isEditing ? (
              <text
                x={PADDING}
                y={top + 12}
                fontSize={12}
                fill="#333"
                onDoubleClick={(e) => {
                  stopAndSelect(e);
                  setEditingAttrId(attr.id);
                }}
                style={{ userSelect: "none" }}
              >
                {attr.pk ? "🔑 " : ""}
                {attr.name}: {attr.type}
                {attr.required ? "!" : ""}
              </text>
            ) : (
              <foreignObject
                x={PADDING}
                y={top}
                width={width - PADDING * 2}
                height={ROW_H + 4}
              >
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex items-center gap-2"
                >
                  <input
                    defaultValue={attr.name}
                    className="h-6 flex-1 rounded border px-2 text-[12px] outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingAttrId(null);
                    }}
                    onBlur={(e) =>
                      updateAttr(attr.id, {
                        name: e.currentTarget.value.trim() || "campo",
                      })
                    }
                  />
                  <select
                    defaultValue={attr.type}
                    className="h-6 rounded border px-1 text-[12px]"
                    onChange={(e) =>
                      updateAttr(attr.id, { type: e.target.value })
                    }
                  >
                    <option>string</option>
                    <option>int</option>
                    <option>long</option>
                    <option>double</option>
                    <option>boolean</option>
                    <option>date</option>
                  </select>
                  <label className="flex items-center gap-1 text-[12px]">
                    <input
                      type="checkbox"
                      defaultChecked={!!attr.required}
                      onChange={(e) =>
                        updateAttr(attr.id, { required: e.target.checked })
                      }
                    />
                    req
                  </label>
                  <label className="flex items-center gap-1 text-[12px]">
                    <input
                      type="checkbox"
                      defaultChecked={!!attr.pk}
                      onChange={(e) => updateAttr(attr.id, { pk: e.target.checked })}
                    />
                    pk
                  </label>
                  <button
                    className="h-6 rounded bg-red-500 px-2 text-[12px] text-white"
                    onClick={() => delAttr(attr.id)}
                  >
                    borrar
                  </button>
                  <button
                    className="h-6 rounded bg-gray-200 px-2 text-[12px]"
                    onClick={() => setEditingAttrId(null)}
                  >
                    ok
                  </button>
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}

      {/* ====== HANDLES (fuera del map) ====== */}
      {onStartLink && (
        <>
          {/* izquierda */}
          <circle
            cx={0}
            cy={midY}
            r={6}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: "crosshair" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartLink(id, "L");
            }}
          />
          {/* derecha */}
          <circle
            cx={width}
            cy={midY}
            r={6}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: "crosshair" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartLink(id, "R");
            }}
          />
          {/* arriba */}
          <circle
            cx={midX}
            cy={HEADER_H}
            r={6}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: "crosshair" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartLink(id, "T");
            }}
          />
          {/* abajo */}
          <circle
            cx={midX}
            cy={HEADER_H + bodyH}
            r={6}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: "crosshair" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartLink(id, "B");
            }}
          />
        </>
      )}
      {/* ====== FIN HANDLES ====== */}

      {/* botón agregar atributo */}
      <foreignObject
        x={PADDING}
        y={HEADER_H + PADDING + (attributes?.length ?? 0) * ROW_H + 8}
        width={width - PADDING * 2}
        height={28}
      >
        <button
          className="h-7 w-full rounded bg-white/70 text-[12px] hover:bg-white"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => addAttr()}
        >
          + Añadir atributo
        </button>
      </foreignObject>

      {/* === HITBOX para asegurar el click en modo Linking === */}
      <rect
        className="entity-hit"
        x={0}
        y={0}
        width={width}
        height={HEADER_H + bodyH}
        fill="transparent"
        pointerEvents="all"
        onPointerDown={(e) => {
          // Cuando el SVG está en modo Linking, esta hitbox captura el click
          onPointerDown(e, id);
        }}
      />
    </g>
  );
});
