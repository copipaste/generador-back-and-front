"use client";

import React, { useMemo } from "react";
import { useMutation, useOthers, useSelf, useStorage } from "@liveblocks/react";
import { nanoid } from "nanoid";
import Link from "next/link";
import { PiSidebarSimpleThin } from "react-icons/pi";
import { IoLayersOutline, IoCubeOutline, IoGitNetworkOutline } from "react-icons/io5";

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

  // Mutations para atributos
  const addAttribute = useMutation(
    ({ storage }) => {
      if (!selectedLayerId) return;
      const lo: any = storage.get("layers").get(selectedLayerId);
      if (!lo) return;
      const current = lo.toImmutable() as EntityLayer;
      const newAttr = {
        id: nanoid(),
        name: "nuevoCampo",
        type: "string",
        required: false,
        pk: false,
      };
      lo.update({ attributes: [...(current.attributes || []), newAttr] });
    },
    [selectedLayerId],
  );

  const updateAttribute = useMutation(
    ({ storage }, attrId: string, patch: any) => {
      if (!selectedLayerId) return;
      const lo: any = storage.get("layers").get(selectedLayerId);
      if (!lo) return;
      const current = lo.toImmutable() as EntityLayer;
      const attrs = current.attributes || [];
      const index = attrs.findIndex((a) => a.id === attrId);
      if (index < 0) return;
      const updated = [...attrs];
      updated[index] = { ...attrs[index], ...patch };
      lo.update({ attributes: updated });
    },
    [selectedLayerId],
  );

  const deleteAttribute = useMutation(
    ({ storage }, attrId: string) => {
      if (!selectedLayerId) return;
      const lo: any = storage.get("layers").get(selectedLayerId);
      if (!lo) return;
      const current = lo.toImmutable() as EntityLayer;
      const attrs = current.attributes || [];
      lo.update({ attributes: attrs.filter((a) => a.id !== attrId) });
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

  // Agrupar capas por tipo
  const { entities, relations } = useMemo(() => {
    const entities: string[] = [];
    const relations: string[] = [];

    if (layerIds) {
      layerIds.forEach((id) => {
        const lo: any = layers?.get(id);
        const layer = toPojo<Layer>(lo);
        if (!layer) return;

        if (layer.type === LayerType.Entity) {
          entities.push(id);
        } else if (layer.type === LayerType.Relation) {
          relations.push(id);
        }
      });
    }

    return { entities, relations };
  }, [layerIds, layers]);

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
          text={ent.name ?? "Entidad"}
          isSelected={isSelected}
          icon={
            <IoCubeOutline className="h-5 w-5" />
          }
        />
      );
    }

    if (layer.type === LayerType.Relation) {
      const rel = layer as RelationLayer;
      const src = toPojo<EntityLayer>(layers?.get(rel.sourceId));
      const dst = toPojo<EntityLayer>(layers?.get(rel.targetId));
      const label = `${src?.name ?? "?"} → ${dst?.name ?? "?"}`;
      return (
        <LayerButton
          key={id}
          layerId={id}
          text={label}
          isSelected={isSelected}
          icon={
            <IoGitNetworkOutline className="h-5 w-5" />
          }
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
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-2">
              <IoLayersOutline className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Capas</h3>
              {layerIds && layerIds.length > 0 && (
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  {layerIds.length}
                </span>
              )}
            </div>

            {!layerIds || layerIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <IoLayersOutline className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No hay capas</p>
                <p className="text-xs text-gray-400 mt-1">Crea una entidad o relación</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Entidades */}
                {entities.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <IoCubeOutline className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Entidades
                      </span>
                      <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                        {entities.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entities.map((id) => layerListItem(id))}
                    </div>
                  </div>
                )}

                {/* Relaciones */}
                {relations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <IoGitNetworkOutline className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Relaciones
                      </span>
                      <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-600">
                        {relations.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {relations.map((id) => layerListItem(id))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
                    key={`entity-name-${selectedLayerId}`}
                    className="h-8 rounded border px-2 text-sm outline-none"
                    defaultValue={(selectedLayerPOJO as EntityLayer).name ?? "Entidad"}
                    onBlur={(e) => {
                      const v = e.currentTarget.value.trim() || "Entidad";
                      updateSelected({ name: v });
                    }}
                  />
                </Section>

                <Divider />
                <Section title="Atributos">
                  <div className="max-h-[300px] space-y-2 overflow-y-auto">
                    {((selectedLayerPOJO as EntityLayer).attributes || []).map((attr) => (
                      <div key={attr.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                        {/* Nombre del atributo */}
                        <div>
                          <Label text="Nombre" />
                          <input
                            key={`attr-name-${attr.id}`}
                            className="h-7 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-blue-500"
                            defaultValue={attr.name}
                            onBlur={(e) => {
                              const v = e.currentTarget.value.trim() || "campo";
                              updateAttribute(attr.id, { name: v });
                            }}
                          />
                        </div>

                        {/* Tipo de dato */}
                        <div>
                          <Label text="Tipo" />
                          <select
                            className="h-7 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-blue-500"
                            value={attr.type ?? "string"}
                            onChange={(e) => updateAttribute(attr.id, { type: e.target.value })}
                          >
                            <option value="string">string</option>
                            <option value="int">int</option>
                            <option value="long">long</option>
                            <option value="float">float</option>
                            <option value="double">double</option>
                            <option value="boolean">boolean</option>
                            <option value="date">date</option>
                            <option value="datetime">datetime</option>
                            <option value="uuid">uuid</option>
                            <option value="email">email</option>
                            <option value="password">password</option>
                          </select>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={attr.required ?? false}
                              onChange={(e) => updateAttribute(attr.id, { required: e.target.checked })}
                              className="h-3.5 w-3.5 rounded"
                            />
                            <span>Requerido</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={attr.pk ?? false}
                              onChange={(e) => updateAttribute(attr.id, { pk: e.target.checked })}
                              className="h-3.5 w-3.5 rounded"
                            />
                            <span>PK</span>
                          </label>
                        </div>

                        {/* Botón eliminar */}
                        <button
                          onClick={() => deleteAttribute(attr.id)}
                          className="w-full rounded bg-red-500 px-3 py-1.5 text-xs text-white hover:bg-red-600 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Botón añadir atributo */}
                  <button
                    onClick={() => addAttribute()}
                    className="mt-3 w-full rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    + Añadir Atributo
                  </button>
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
                <Section title="Tipo de Relación UML">
                  <Label text="Selecciona el tipo" />
                  <Dropdown
                    value={(selectedLayerPOJO as RelationLayer).relationType ?? "association"}
                    onChange={(v) =>
                      updateSelected({
                        relationType: v as RelationLayer["relationType"],
                      })
                    }
                    options={[
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
                              <marker id="uml-vee-open-sidebar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M0,0 L10,5 L0,10" fill="none" stroke="currentColor" strokeWidth="2"/>
                              </marker>
                            </defs>
                            <line x1="2" y1="10" x2="34" y2="10" stroke="currentColor" strokeWidth="1.5"
                                  strokeDasharray="3 2" markerEnd="url(#uml-vee-open-sidebar)"
                                  vectorEffect="non-scaling-stroke" strokeLinecap="round"/>
                          </svg>
                        )
                      },
                    ]}
                  />
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
