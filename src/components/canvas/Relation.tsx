// src/components/canvas/Relation.tsx
"use client";

import { memo } from "react";
import { useStorage, useMutation } from "@liveblocks/react";
import type { EntityLayer, RelationLayer } from "~/types";

type Props = {
  id: string;
  layer: RelationLayer;
  onPointerDown?: (e: React.PointerEvent, id: string) => void;
};

function centerOf(e: EntityLayer) {
  return { x: e.x + e.width / 2, y: e.y + e.height / 2 };
}

function intersectRectEdge(
  from: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number },
) {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  let bestT = Number.POSITIVE_INFINITY;
  let hit = from;

  if (dx !== 0) {
    const tL = (left - from.x) / dx;
    const yL = from.y + tL * dy;
    if (tL > 0 && yL >= top && yL <= bottom && tL < bestT) {
      bestT = tL;
      hit = { x: left, y: yL };
    }
    const tR = (right - from.x) / dx;
    const yR = from.y + tR * dy;
    if (tR > 0 && yR >= top && yR <= bottom && tR < bestT) {
      bestT = tR;
      hit = { x: right, y: yR };
    }
  }

  if (dy !== 0) {
    const tT = (top - from.y) / dy;
    const xT = from.x + tT * dx;
    if (tT > 0 && xT >= left && xT <= right && tT < bestT) {
      bestT = tT;
      hit = { x: xT, y: top };
    }
    const tB = (bottom - from.y) / dy;
    const xB = from.x + tB * dx;
    if (tB > 0 && xB >= left && xB <= right && tB < bestT) {
      bestT = tB;
      hit = { x: xB, y: bottom };
    }
  }

  return hit;
}

function lerp(a: { x: number; y: number }, b: { x: number; y: number }, t: number) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export default memo(function Relation({ id, layer, onPointerDown }: Props) {
  const src = useStorage((root) => root.layers.get(layer.sourceId)) as EntityLayer | undefined;
  const dst = useStorage((root) => root.layers.get(layer.targetId)) as EntityLayer | undefined;
  if (!src || !dst) return null;

  const c1 = centerOf(src);
  const c2 = centerOf(dst);

  const p1 = intersectRectEdge(c1, src, c2);
  const p2 = intersectRectEdge(c2, dst, c1);

  const toggleSrc = useMutation(({ storage }) => {
    const lo: any = storage.get("layers").get(id);
    lo?.update({ sourceCard: lo.get("sourceCard") === "ONE" ? "MANY" : "ONE" });
  }, [id]);

  const toggleDst = useMutation(({ storage }) => {
    const lo: any = storage.get("layers").get(id);
    lo?.update({ targetCard: lo.get("targetCard") === "ONE" ? "MANY" : "ONE" });
  }, [id]);

  const toggleOwner = useMutation(({ storage }) => {
    const lo: any = storage.get("layers").get(id);
    if (!lo) return;
    const cur = lo.get("owningSide");
    lo.update({ owningSide: cur === "source" ? "target" : "source" });
  }, [id]);

  const removeSelf = useMutation(({ storage }) => {
    const layers = storage.get("layers");
    const list = storage.get("layerIds");
    layers.delete(id);
    for (let i = 0; i < list.length; i++) {
      if (list.get(i) === id) {
        list.delete(i);
        break;
      }
    }
  }, [id]);

  const label = (c: "ONE" | "MANY") => (c === "ONE" ? "1" : "N");
  const lblSrc = lerp(p1, p2, 0.25);
  const lblDst = lerp(p2, p1, 0.25);
  const owner = layer.owningSide;
  const mid = lerp(p1, p2, 0.5);

  return (
    <g
      className="relation"
      onPointerDown={(e) => onPointerDown?.(e, id)}
      pointerEvents="stroke"
      stroke="#475569"
      fill="none"
    >
      {/* línea visible */}
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeWidth={1.5} />

      {/* hit area invisible para seleccionar fácil */}
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        strokeWidth={12}
        stroke="transparent"
        pointerEvents="stroke"
        onPointerDown={(e) => onPointerDown?.(e, id)}
      />

      {/* extremos (owner con clic derecho) */}
      <circle
        cx={p1.x}
        cy={p1.y}
        r={4}
        fill={owner === "source" ? "#0ea5e9" : "#fff"}
        stroke="#0ea5e9"
        strokeWidth={1.5}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); toggleOwner(); }}
      />
      <circle
        cx={p2.x}
        cy={p2.y}
        r={4}
        fill={owner === "target" ? "#0ea5e9" : "#fff"}
        stroke="#0ea5e9"
        strokeWidth={1.5}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); toggleOwner(); }}
      />

      {/* etiquetas 1/N – bloquear click simple (evita selección) pero permitir doble click */}
      <text
        x={lblSrc.x}
        y={lblSrc.y}
        fontSize={12}
        fill="#334155"
        onPointerDown={(e) => e.stopPropagation()}   
        onDoubleClick={(e) => { e.stopPropagation(); toggleSrc(); }}
      >
        {label(layer.sourceCard)}
      </text>
      <text
        x={lblDst.x}
        y={lblDst.y}
        fontSize={12}
        fill="#334155"
        onPointerDown={(e) => e.stopPropagation()}   
        onDoubleClick={(e) => { e.stopPropagation(); toggleDst(); }}
      >
        {label(layer.targetCard)}
      </text>

      {/* botón borrar en el centro (opcional) */}
      <g transform={`translate(${mid.x}, ${mid.y})`} pointerEvents="all">
        <circle
          r={9}
          fill="#ef4444"
          stroke="white"
          strokeWidth={1.5}
          onPointerDown={(e) => { e.stopPropagation(); removeSelf(); }}
        />
        <text x={-3.5} y={3.5} fontSize={10} fill="white" style={{ userSelect: "none", pointerEvents: "none" }}>
          ✕
        </text>
      </g>
    </g>
  );
});
