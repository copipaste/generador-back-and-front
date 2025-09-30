"use client";

import React, { useMemo } from "react";
import { useMutation, useOthers, useSelf, useStorage } from "@liveblocks/react";
import Link from "next/link";
import { PiSidebarSimpleThin } from "react-icons/pi";

import { Color, Layer, LayerType, EntityLayer, RelationLayer } from "~/types";
import { colorToCss, connectionIdToColor, hexToRgb } from "~/utils";

import LayerButton from "./LayerButton";
import NumberInput from "./NumberInput";
import ColorPicker from "./ColorPicker";
import Dropdown from "./Dropdown";
import UserAvatar from "./UserAvatar";
import ShareMenu from "./ShareMenu";
import { User } from "@prisma/client";

/* ---------- UI helpers ---------- */
const Divider = () => <div className="my-2 border-b border-gray-200" />;

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 p-4">
    <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    {children}
  </div>
);

const Label = ({ text }: { text: string }) => (
  <p className="text-xs font-medium text-gray-500">{text}</p>
);

/* ---------- utils ---------- */
const toPojo = <T,>(maybeLive: any): T | null => {
  if (!maybeLive) return null;
  return typeof maybeLive.toImmutable === "function"
    ? (maybeLive.toImmutable() as T)
    : (maybeLive as T);
};

/* =============================== COMPONENTE =============================== */

export default function Sidebars({
  roomName,
  roomId,
  othersWithAccessToRoom,
  leftIsMinimized,
  setLeftIsMinimized,
}: {
  roomName: string;
  roomId: string;
  othersWithAccessToRoom: User[];
  leftIsMinimized: boolean;
  setLeftIsMinimized: (value: boolean) => void;
}) {
  const me = useSelf();
  const others = useOthers();

  const selectedLayerId = useSelf((me) => {
    const sel = me.presence.selection;
    return sel.length === 1 ? sel[0] : null;
  });

  const roomColor = useStorage((root) => root.roomColor);
  const layers = useStorage((root) => root.layers);
  const layerIds = useStorage((root) => root.layerIds);

  const selectedLayer = useStorage((root) =>
    selectedLayerId ? (root.layers.get(selectedLayerId) as any) : null,
  );
  const selectedLayerPOJO = toPojo<Layer>(selectedLayer);

  const selection = useSelf((me) => me.presence.selection);
  const reversedLayerIds = useMemo(
    () => [...(layerIds ?? [])].reverse(),
    [layerIds],
  );

  const isLeftOpen = !leftIsMinimized;
  const hasSelection = !!selectedLayerPOJO;

  /* ---------------------------- Mutations ---------------------------- */
  const setRoomColor = useMutation(({ storage }, newColor: Color) => {
    storage.set("roomColor", newColor);
  }, []);

  // Actualizadores separados (evita el error de 'never' en useMutation)
  const updateEntity = useMutation(
    ({ storage }, patch: Partial<EntityLayer>) => {
      if (!selectedLayerId) return;
      const lo: any = storage.get("layers").get(selectedLayerId);
      if (!lo) return;
      lo.update(patch);
    },
    [selectedLayerId],
  );

  const updateRelation = useMutation(
    ({ storage }, patch: Partial<RelationLayer>) => {
      if (!selectedLayerId) return;
      const lo: any = storage.get("layers").get(selectedLayerId);
      if (!lo) return;
      lo.update(patch);
    },
    [selectedLayerId],
  );

  // Wrapper amigable
  const updateSelected = (
    patch: Partial<EntityLayer> & Partial<RelationLayer>,
  ) => {
    if (!selectedLayerPOJO) return;
    if (selectedLayerPOJO.type === LayerType.Entity) {
      updateEntity(patch as Partial<EntityLayer>);
    } else if (selectedLayerPOJO.type === LayerType.Relation) {
      updateRelation(patch as Partial<RelationLayer>);
    }
  };

  /* =============================== RENDER =============================== */

  const layerListItem = (id: string) => {
    const lo: any = layers?.get(id);
    const layer = toPojo<Layer>(lo);
    if (!layer) return null;

    const isSelected = selection?.includes(id) ?? false;

    if (layer.type === LayerType.Entity) {
      const ent = layer as EntityLayer;
      return (
        <LayerButton
          key={id}
          layerId={id}
          text={`Entidad: ${ent.name ?? "Entidad"}`}
          isSelected={isSelected}
          icon={<span className="text-gray-500">📦</span>}
        />
      );
    }

    if (layer.type === LayerType.Relation) {
      const rel = layer as RelationLayer;
      const src = toPojo<EntityLayer>(layers?.get(rel.sourceId));
      const dst = toPojo<EntityLayer>(layers?.get(rel.targetId));
      const label = `Relación: ${src?.name ?? "?"} → ${dst?.name ?? "?"}`;
      return (
        <LayerButton
          key={id}
          layerId={id}
          text={label}
          isSelected={isSelected}
          icon={<span className="text-gray-500">🔗</span>}
        />
      );
    }

    return null;
  };

  return (
    <>
      {/* --------- Sidebar IZQUIERDO --------- */}
      {isLeftOpen ? (
        <div className="fixed left-0 flex h-screen w-[240px] flex-col border-r border-gray-200 bg-white">
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Link href="/dashboard">
                <img src="/figma-logo.svg" alt="Figma logo" className="h-5 w-5" />
              </Link>
              <PiSidebarSimpleThin
                onClick={() => setLeftIsMinimized(true)}
                className="h-5 w-5 cursor-pointer text-gray-600 hover:text-gray-800"
              />
            </div>
            <h2 className="mt-3 text-base font-semibold text-gray-800">{roomName}</h2>
          </div>

          <Divider />

          {/* Lista de capas */}
          <div className="flex flex-col gap-2 p-4">
            <span className="mb-1 text-sm font-medium text-gray-600">Capas</span>
            {layerIds && reversedLayerIds.map((id) => layerListItem(id))}
          </div>
        </div>
      ) : (
        // IZQ minimizado
        <div className="fixed left-3 top-3 flex h-[48px] w-[250px] items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
          <Link href="/dashboard">
            <img src="/figma-logo.svg" alt="Figma logo" className="h-5 w-5" />
          </Link>
          <h2 className="max-w-[180px] truncate text-sm font-medium text-gray-800">
            {roomName}
          </h2>
          <PiSidebarSimpleThin
            onClick={() => setLeftIsMinimized(false)}
            className="h-5 w-5 cursor-pointer text-gray-600 hover:text-gray-800"
          />
        </div>
      )}

      {/* --------- Sidebar DERECHO --------- */}
      {isLeftOpen || hasSelection ? (
        <div
          className={[
            "fixed right-0 flex w-[260px] flex-col border-l border-gray-200 bg-white",
            leftIsMinimized && hasSelection ? "bottom-3 right-3 top-3 rounded-xl" : "",
            !leftIsMinimized && !hasSelection ? "h-screen" : "",
            !leftIsMinimized && hasSelection ? "bottom-0 top-0 h-screen" : "",
          ].join(" ")}
        >
          {/* Avatares + Compartir */}
          <div className="flex items-center justify-between pr-2">
            <div className="max-36 flex w-full gap-2 overflow-x-auto p-3 text-sm">
              {me && (
                <UserAvatar
                  color={connectionIdToColor(me.connectionId)}
                  name={me.info.name}
                />
              )}
              {others.map((o) => (
                <UserAvatar
                  key={o.connectionId}
                  color={connectionIdToColor(o.connectionId)}
                  name={o.info.name}
                />
              ))}
            </div>
            <ShareMenu
              roomId={roomId}
              othersWithAccessToRoom={othersWithAccessToRoom}
            />
          </div>

          <Divider />

          {/* Contenido según selección */}
          {hasSelection && selectedLayerPOJO ? (
            selectedLayerPOJO.type === LayerType.Entity ? (
              <>
                {/* ENTITY */}
                <Section title="Entidad">
                  <Label text="Nombre" />
                  <input
                    className="h-8 rounded border px-2 text-sm outline-none"
                    defaultValue={(selectedLayerPOJO as EntityLayer).name ?? "Entidad"}
                    onBlur={(e) => {
                      const v = e.currentTarget.value.trim() || "Entidad";
                      updateSelected({ name: v });
                    }}
                  />
                </Section>

                <Divider />
                <Section title="Posición">
                  <Label text="Coordenadas" />
                  <div className="flex gap-2">
                    <NumberInput
                      value={selectedLayerPOJO.x ?? 0}
                      onChange={(n) => updateSelected({ x: n })}
                      classNames="w-1/2"
                      icon={<p>X</p>}
                    />
                    <NumberInput
                      value={selectedLayerPOJO.y ?? 0}
                      onChange={(n) => updateSelected({ y: n })}
                      classNames="w-1/2"
                      icon={<p>Y</p>}
                    />
                  </div>
                </Section>

                <Divider />
                <Section title="Tamaño">
                  <Label text="Dimensiones" />
                  <div className="flex gap-2">
                    <NumberInput
                      value={selectedLayerPOJO.width ?? 0}
                      onChange={(n) => updateSelected({ width: n })}
                      classNames="w-1/2"
                      icon={<p>W</p>}
                    />
                    <NumberInput
                      value={selectedLayerPOJO.height ?? 0}
                      onChange={(n) => updateSelected({ height: n })}
                      classNames="w-1/2"
                      icon={<p>H</p>}
                    />
                  </div>
                </Section>

                <Divider />
                <Section title="Apariencia">
                  <Label text="Opacidad" />
                  <NumberInput
                    value={selectedLayerPOJO.opacity ?? 100}
                    min={0}
                    max={100}
                    onChange={(n) => updateSelected({ opacity: n })}
                    classNames="w-full"
                    icon={<p>%</p>}
                  />
                </Section>
              </>
            ) : (
              <>
                {/* RELATION */}
                <Section title="Relación">
                  {(() => {
                    const rel = selectedLayerPOJO as RelationLayer;
                    const src = toPojo<EntityLayer>(layers?.get(rel.sourceId));
                    const dst = toPojo<EntityLayer>(layers?.get(rel.targetId));
                    return (
                      <div className="space-y-2 text-sm">
                        <div>
                          <Label text="Origen" />
                          <div className="rounded border bg-gray-50 px-2 py-1">
                            {src?.name ?? rel.sourceId}
                          </div>
                        </div>
                        <div>
                          <Label text="Destino" />
                          <div className="rounded border bg-gray-50 px-2 py-1">
                            {dst?.name ?? rel.targetId}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </Section>

                <Divider />
                <Section title="Cardinalidades">
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Label text="Source" />
                      <Dropdown
                        value={(selectedLayerPOJO as RelationLayer).sourceCard ?? "ONE"}
                        onChange={(v) =>
                          updateSelected({
                            sourceCard: (v as RelationLayer["sourceCard"]) ?? "ONE",
                          })
                        }
                        options={["ONE", "MANY"]}
                      />
                    </div>
                    <div className="w-1/2">
                      <Label text="Target" />
                      <Dropdown
                        value={(selectedLayerPOJO as RelationLayer).targetCard ?? "ONE"}
                        onChange={(v) =>
                          updateSelected({
                            targetCard: (v as RelationLayer["targetCard"]) ?? "ONE",
                          })
                        }
                        options={["ONE", "MANY"]}
                      />
                    </div>
                  </div>
                </Section>

                <Divider />
                <Section title="Propiedad (owning side)">
                  <Dropdown
                    value={(selectedLayerPOJO as RelationLayer).owningSide ?? "target"}
                    onChange={(v) =>
                      updateSelected({
                        owningSide: (v as RelationLayer["owningSide"]) ?? "target",
                      })
                    }
                    options={["source", "target"]}
                  />
                </Section>

                <Divider />
                <Section title="Apariencia">
                  <Label text="Opacidad" />
                  <NumberInput
                    value={selectedLayerPOJO.opacity ?? 100}
                    min={0}
                    max={100}
                    onChange={(n) => updateSelected({ opacity: n })}
                    classNames="w-full"
                    icon={<p>%</p>}
                  />
                </Section>
              </>
            )
          ) : (
            // Sin selección -> color de página
            <Section title="Página">
              <ColorPicker
                value={roomColor ? colorToCss(roomColor) : "#1e1e1e"}
                onChange={(hex) => setRoomColor(hexToRgb(hex))}
              />
            </Section>
          )}
        </div>
      ) : (
        // DER minimizado
        <div className="fixed right-3 top-3 flex h-[48px] w-[250px] items-center justify-between rounded-xl border bg-white pr-2">
          <div className="max-36 flex w-full gap-2 overflow-x-auto p-3 text-xs">
            {me && (
              <UserAvatar
                color={connectionIdToColor(me.connectionId)}
                name={me.info.name}
              />
            )}
            {others.map((o) => (
              <UserAvatar
                key={o.connectionId}
                color={connectionIdToColor(o.connectionId)}
                name={o.info.name}
              />
            ))}
          </div>
          <ShareMenu
            roomId={roomId}
            othersWithAccessToRoom={othersWithAccessToRoom}
          />
        </div>
      )}
    </>
  );
}
