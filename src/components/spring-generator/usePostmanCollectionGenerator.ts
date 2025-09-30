// src/components/postman-generator/usePostmanCollectionGenerator.ts
"use client";

import { useStorage } from "@liveblocks/react";
import { LayerType } from "~/types";
import type { EntityLayer, RelationLayer } from "~/types";

/* ---------- helpers ---------- */
type Attr = { id: string; name: string; type: string; required?: boolean; pk?: boolean };
type PlainEntity = EntityLayer & { idInCanvas: string };
type PlainRelation = RelationLayer & { idInCanvas: string };

const sampleForType = (name: string, t: string) => {
  const low = (t || "").toLowerCase();
  if (low === "int" || low === "integer") return 1;
  if (low === "long") return 1;
  if (low === "double") return 1;
  if (low === "boolean") return true;
  if (low === "date") return "2024-01-01";
  return name || "text";
};

const camel = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/* ---------- hook ---------- */
export function usePostmanCollectionGenerator(projectName: string) {
  const layerIds = useStorage((root) => root.layerIds) || [];
  const layersMap = useStorage((root) => root.layers);

  const readRaw = (id: string): any | null => {
    const live: any = layersMap?.get(id);
    if (!live) return null;
    return typeof live.toImmutable === "function" ? live.toImmutable() : live;
  };

  const getEntitiesAndRelations = () => {
    const entities: PlainEntity[] = [];
    const relations: PlainRelation[] = [];
    for (const id of layerIds) {
      const raw = readRaw(id);
      if (!raw) continue;
      if (raw.type === LayerType.Entity) entities.push({ ...(raw as EntityLayer), idInCanvas: id });
      else if (raw.type === LayerType.Relation) relations.push({ ...(raw as RelationLayer), idInCanvas: id });
    }
    return { entities, relations };
  };

  /** Devuelve, para cada ENTIDAD HIJA (lado MANY), el listado de FK { fieldName, other(parent), otherIdName } */
  const buildManyToOneMap = (entities: PlainEntity[], relations: PlainRelation[]) => {
    const byId = new Map(entities.map((e) => [e.idInCanvas, e]));
    const map: Record<
      string,
      Array<{ fieldName: string; other: PlainEntity; otherIdName: string }>
    > = {};

    for (const rel of relations) {
      const src = byId.get(rel.sourceId);
      const dst = byId.get(rel.targetId);
      if (!src || !dst) continue;

      const srcMany = rel.sourceCard === "MANY";
      const dstMany = rel.targetCard === "MANY";

      const srcIdName =
        (src.attributes as Attr[] | undefined)?.find((a) => a.pk)?.name || "id";
      const dstIdName =
        (dst.attributes as Attr[] | undefined)?.find((a) => a.pk)?.name || "id";

      // child = lado MANY  |  parent = lado ONE
      if (srcMany && !dstMany) {
        const child = src;
        const parent = dst;
        const fieldName = camel(parent.name.replace(/[^A-Za-z0-9]/g, "") || "parent");
        (map[child.idInCanvas] ||= []).push({ fieldName, other: parent, otherIdName: dstIdName });
      }
      if (dstMany && !srcMany) {
        const child = dst;
        const parent = src;
        const fieldName = camel(parent.name.replace(/[^A-Za-z0-9]/g, "") || "parent");
        (map[child.idInCanvas] ||= []).push({ fieldName, other: parent, otherIdName: srcIdName });
      }
    }
    return map;
  };

  const generatePostman = async () => {
    const { entities, relations } = getEntitiesAndRelations();
    if (!entities.length) {
      alert("No hay entidades en el lienzo.");
      return;
    }

    const manyToOneByEntity = buildManyToOneMap(entities, relations);

    // Para endpoints /api/<child>/<parent>/{parentId}
    const byId = new Map(entities.map((e) => [e.idInCanvas, e]));
    const findersByChild: Record<
      string,
      Array<{ parentField: string; parentIdName: string }>
    > = {};
    for (const rel of relations) {
      const src = byId.get(rel.sourceId);
      const dst = byId.get(rel.targetId);
      if (!src || !dst) continue;

      const srcMany = rel.sourceCard === "MANY";
      const dstMany = rel.targetCard === "MANY";

      const srcIdName =
        (src.attributes as Attr[] | undefined)?.find((a) => a.pk)?.name || "id";
      const dstIdName =
        (dst.attributes as Attr[] | undefined)?.find((a) => a.pk)?.name || "id";

      const srcField = camel(src.name.replace(/[^A-Za-z0-9]/g, "") || "source");
      const dstField = camel(dst.name.replace(/[^A-Za-z0-9]/g, "") || "target");

      if (srcMany && !dstMany) {
        (findersByChild[src.idInCanvas] ||= []).push({
          parentField: dstField,
          parentIdName: dstIdName,
        });
      }
      if (dstMany && !srcMany) {
        (findersByChild[dst.idInCanvas] ||= []).push({
          parentField: srcField,
          parentIdName: srcIdName,
        });
      }
    }

    const baseUrlVar = "{{baseUrl}}";
    const collection: any = {
      info: {
        name: `API ${projectName}`,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      variable: [{ key: "baseUrl", value: "http://localhost:8080" }],
      item: [] as any[],
    };

    const makeUrl = (path: string) => ({
      raw: `${baseUrlVar}${path}`,
      host: [baseUrlVar],
      path: path.split("/").filter(Boolean),
    });

    const makeRequest = (
      name: string,
      method: "GET" | "POST" | "PUT" | "DELETE",
      path: string,
      body?: any,
    ) => {
      const req: any = {
        name,
        request: {
          method,
          header: [{ key: "Content-Type", value: "application/json" }],
          url: makeUrl(path),
        },
        response: [],
      };
      if (body) req.request.body = { mode: "raw", raw: JSON.stringify(body, null, 2) };
      return req;
    };

    for (const ent of entities) {
      const className = ent.name.replace(/[^A-Za-z0-9]/g, "") || "Entity";
      const varName = camel(className);
      const basePath = `/api/${varName}`;

      const attrs = (ent.attributes || []) as Attr[];
      const idAttr = attrs.find((a) => a.pk);
      const idName = (idAttr?.name ?? "id").replace(/[^A-Za-z0-9_]/g, "") || "id";

      // Body ejemplo
      const bodyExample: Record<string, any> = {};
      for (const a of attrs) {
        if (a.pk) continue;
        const field = (a.name || "field").replace(/[^A-Za-z0-9_]/g, "");
        bodyExample[field] = sampleForType(field, a.type || "string");
      }

      // ⬅️ Aquí se agregan las FKs MANY→ONE como objeto { "<idPadre>": 1 }
      const m2os = manyToOneByEntity[ent.idInCanvas] || [];
      for (const m of m2os) {
        const idField = (m.otherIdName || "id").replace(/[^A-Za-z0-9_]/g, "") || "id";
        bodyExample[m.fieldName] = { [idField]: 1 };
      }

      const folder = { name: className, item: [] as any[] };

      folder.item.push(makeRequest(`GET ${className} - lista`, "GET", `${basePath}`));
      folder.item.push(makeRequest(`GET ${className} - por id`, "GET", `${basePath}/:id`));
      folder.item.push(makeRequest(`POST ${className} - crear`, "POST", `${basePath}`, bodyExample));
      folder.item.push(makeRequest(`PUT ${className} - actualizar`, "PUT", `${basePath}/:id`, bodyExample));
      folder.item.push(makeRequest(`DELETE ${className} - eliminar`, "DELETE", `${basePath}/:id`));

      const finders = findersByChild[ent.idInCanvas] || [];
      for (const f of finders) {
        folder.item.push(
          makeRequest(
            `GET ${className} - por ${f.parentField}Id`,
            "GET",
            `${basePath}/${f.parentField}/:parentId`,
          ),
        );
      }

      collection.item.push(folder);
    }

    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "_")}_postman.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return generatePostman;
}
