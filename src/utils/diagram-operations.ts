import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import { LayerType } from "~/types";
import type { EntityLayer, RelationLayer, DBAttribute, RelationType } from "~/types";

/**
 * Operaciones CRUD para el diagrama
 * Estas funciones son usadas por el asistente de chat para modificar el diagrama
 */

export type DiagramStorage = any; // Storage de Liveblocks

// ==================== OPERACIONES DE ENTIDADES ====================

/**
 * Añade una nueva entidad al diagrama
 */
export function addEntityOperation(
  storage: DiagramStorage,
  name: string,
  attributes: Omit<DBAttribute, "id">[],
  position?: { x: number; y: number }
) {
  const layers = storage.get("layers");
  const layerIds = storage.get("layerIds");
  
  const id = nanoid();
  
  // Posición automática si no se especifica
  const finalPosition = position || {
    x: 100 + Math.random() * 400,
    y: 100 + Math.random() * 300,
  };

  const entity: EntityLayer = {
    type: LayerType.Entity,
    x: finalPosition.x,
    y: finalPosition.y,
    width: 240,
    height: 140,
    name: name,
    attributes: attributes.map(attr => ({
      id: nanoid(),
      ...attr,
    })),
    opacity: 100,
  };

  layers.set(id, new LiveObject(entity));
  layerIds.push(id);

  return { id, entity };
}

/**
 * Elimina una entidad del diagrama
 */
export function removeEntityOperation(
  storage: DiagramStorage,
  entityId: string
) {
  const layers = storage.get("layers");
  const layerIds = storage.get("layerIds");

  // Eliminar la entidad
  layers.delete(entityId);

  // Eliminar del array de IDs
  for (let i = layerIds.length - 1; i >= 0; i--) {
    if (layerIds.get(i) === entityId) {
      layerIds.delete(i);
      break;
    }
  }

  // Eliminar todas las relaciones que involucran esta entidad
  const allIds = [];
  for (let i = 0; i < layerIds.length; i++) {
    allIds.push(layerIds.get(i));
  }

  for (const id of allIds) {
    const layer = layers.get(id);
    if (layer?.get("type") === "Relation") {
      const sourceId = layer.get("sourceId");
      const targetId = layer.get("targetId");
      
      if (sourceId === entityId || targetId === entityId) {
        layers.delete(id);
        for (let i = layerIds.length - 1; i >= 0; i--) {
          if (layerIds.get(i) === id) {
            layerIds.delete(i);
            break;
          }
        }
      }
    }
  }

  return { removed: entityId };
}

// ==================== OPERACIONES DE ATRIBUTOS ====================

/**
 * Añade un atributo a una entidad existente
 */
export function addAttributeOperation(
  storage: DiagramStorage,
  entityId: string,
  attribute: Omit<DBAttribute, "id">
) {
  const layers = storage.get("layers");
  const layer = layers.get(entityId);

  if (!layer || layer.get("type") !== "Entity") {
    throw new Error(`Entity with id ${entityId} not found`);
  }

  const currentAttrs = layer.get("attributes") || [];
  const newAttr: DBAttribute = {
    id: nanoid(),
    ...attribute,
  };

  layer.update({
    attributes: [...currentAttrs, newAttr],
  });

  return { attributeId: newAttr.id, attribute: newAttr };
}

/**
 * Elimina un atributo de una entidad
 */
export function removeAttributeOperation(
  storage: DiagramStorage,
  entityId: string,
  attributeName: string
) {
  const layers = storage.get("layers");
  const layer = layers.get(entityId);

  if (!layer || layer.get("type") !== "Entity") {
    throw new Error(`Entity with id ${entityId} not found`);
  }

  const currentAttrs = layer.get("attributes") || [];
  const filtered = currentAttrs.filter((attr: DBAttribute) => 
    attr.name.toLowerCase() !== attributeName.toLowerCase()
  );

  layer.update({
    attributes: filtered,
  });

  return { removed: attributeName };
}

/**
 * Modifica un atributo existente
 */
export function modifyAttributeOperation(
  storage: DiagramStorage,
  entityId: string,
  attributeName: string,
  changes: Partial<Omit<DBAttribute, "id">>
) {
  const layers = storage.get("layers");
  const layer = layers.get(entityId);

  if (!layer || layer.get("type") !== "Entity") {
    throw new Error(`Entity with id ${entityId} not found`);
  }

  const currentAttrs = layer.get("attributes") || [];
  const updated = currentAttrs.map((attr: DBAttribute) => {
    if (attr.name.toLowerCase() === attributeName.toLowerCase()) {
      return { ...attr, ...changes };
    }
    return attr;
  });

  layer.update({
    attributes: updated,
  });

  return { modified: attributeName };
}

// ==================== OPERACIONES DE RELACIONES ====================

/**
 * Añade una relación entre dos entidades
 */
export function addRelationOperation(
  storage: DiagramStorage,
  sourceId: string,
  targetId: string,
  relationType: RelationType = "association",
  options?: {
    sourceCard?: "ONE" | "MANY";
    targetCard?: "ONE" | "MANY";
    owningSide?: "source" | "target";
  }
) {
  const layers = storage.get("layers");
  const layerIds = storage.get("layerIds");

  const sourceLayer = layers.get(sourceId);
  const targetLayer = layers.get(targetId);

  if (!sourceLayer || sourceLayer.get("type") !== "Entity") {
    throw new Error(`Source entity with id ${sourceId} not found`);
  }

  if (!targetLayer || targetLayer.get("type") !== "Entity") {
    throw new Error(`Target entity with id ${targetId} not found`);
  }

  const relationId = nanoid();
  const relation: RelationLayer = {
    type: LayerType.Relation,
    sourceId,
    targetId,
    relationType,
    sourceCard: options?.sourceCard || "ONE",
    targetCard: options?.targetCard || "ONE",
    owningSide: options?.owningSide || "target",
    opacity: 100,
  };

  layers.set(relationId, new LiveObject(relation));
  layerIds.push(relationId);

  return { id: relationId, relation };
}

/**
 * Elimina una relación específica
 */
export function removeRelationOperation(
  storage: DiagramStorage,
  relationId: string
) {
  const layers = storage.get("layers");
  const layerIds = storage.get("layerIds");

  const layer = layers.get(relationId);
  if (!layer || layer.get("type") !== "Relation") {
    throw new Error(`Relation with id ${relationId} not found`);
  }

  layers.delete(relationId);

  for (let i = layerIds.length - 1; i >= 0; i--) {
    if (layerIds.get(i) === relationId) {
      layerIds.delete(i);
      break;
    }
  }

  return { removed: relationId };
}

/**
 * Modifica una relación existente
 */
export function modifyRelationOperation(
  storage: DiagramStorage,
  relationId: string,
  changes: Partial<Omit<RelationLayer, "type" | "sourceId" | "targetId">>
) {
  const layers = storage.get("layers");
  const layer = layers.get(relationId);

  if (!layer || layer.get("type") !== "Relation") {
    throw new Error(`Relation with id ${relationId} not found`);
  }

  layer.update(changes);

  return { modified: relationId };
}

// ==================== UTILIDADES ====================

/**
 * Busca una entidad por nombre
 */
export function findEntityByName(
  storage: DiagramStorage,
  entityName: string
): { id: string; entity: EntityLayer } | null {
  const layers = storage.get("layers");
  const layerIds = storage.get("layerIds");

  for (let i = 0; i < layerIds.length; i++) {
    const id = layerIds.get(i);
    const layer = layers.get(id);

    if (layer?.get("type") === "Entity") {
      const name = layer.get("name");
      if (name && name.toLowerCase() === entityName.toLowerCase()) {
        return {
          id,
          entity: layer.toImmutable() as EntityLayer,
        };
      }
    }
  }

  return null;
}

/**
 * Obtiene todas las entidades del diagrama
 */
export function getAllEntities(storage: DiagramStorage): Array<{ id: string; entity: EntityLayer }> {
  const layers = storage.get("layers");
  const layerIds = storage.get("layerIds");
  const entities: Array<{ id: string; entity: EntityLayer }> = [];

  for (let i = 0; i < layerIds.length; i++) {
    const id = layerIds.get(i);
    const layer = layers.get(id);

    if (layer?.get("type") === "Entity") {
      entities.push({
        id,
        entity: layer.toImmutable() as EntityLayer,
      });
    }
  }

  return entities;
}

/**
 * Obtiene todas las relaciones del diagrama
 */
export function getAllRelations(storage: DiagramStorage): Array<{ id: string; relation: RelationLayer }> {
  const layers = storage.get("layers");
  const layerIds = storage.get("layerIds");
  const relations: Array<{ id: string; relation: RelationLayer }> = [];

  for (let i = 0; i < layerIds.length; i++) {
    const id = layerIds.get(i);
    const layer = layers.get(id);

    if (layer?.get("type") === "Relation") {
      relations.push({
        id,
        relation: layer.toImmutable() as RelationLayer,
      });
    }
  }

  return relations;
}
