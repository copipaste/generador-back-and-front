export type Color = { r: number; g: number; b: number };

export type Camera = { x: number; y: number; zoom: number };
export type Point = { x: number; y: number };
export type XYWH = { x: number; y: number; width: number; height: number };


export enum CanvasMode {
  None,
  Pressing,
  Translating,
  Resizing,
  Dragging,
  SelectionNet,
  Inserting,
  RightClick,
  Linking,
}

// 👉 solo lo necesario
export enum LayerType {
  Entity = "Entity",
  Relation = "Relation",
}

export type Anchor = "L" | "R" | "T" | "B";

export type Attribute = {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  pk?: boolean;
};

export type DBPrimitive =
  | "string" | "int" | "long" | "float" | "double" | "boolean"
  | "date" | "datetime" | "uuid" | "email" | "password";

export type Cardinality = "ONE" | "MANY";

export type DBAttribute = {
  id: string;
  name: string;
  type?: DBPrimitive;
  required?: boolean;
  unique?: boolean;
  length?: number;
  pk?: boolean;
};

export type EntityLayer = {
  type: LayerType.Entity;
  x: number; y: number;
  width: number; height: number;
  name: string;
  attributes: DBAttribute[];
  opacity?: number;
};

export type RelationLayer = {
  type: LayerType.Relation;
  sourceId: string;
  targetId: string;
  sourceCard: Cardinality;
  targetCard: Cardinality;
  owningSide?: "source" | "target";
  opacity?: number;
};

export type Layer = EntityLayer | RelationLayer;



export enum Side { Top = 1, Bottom = 2, Left = 4, Right = 8 }



export type CanvasState =
  | { mode: CanvasMode.None }
  | { mode: CanvasMode.Pressing; origin: Point }
  | { mode: CanvasMode.Translating; current: Point }
  | { mode: CanvasMode.Resizing; initialBounds: XYWH; corner: Side }
  | { mode: CanvasMode.Dragging; origin: Point | null }
  | { mode: CanvasMode.SelectionNet; origin: Point; current: Point }
  | { mode: CanvasMode.Inserting }
  | { mode: CanvasMode.RightClick }
  | {
      mode: CanvasMode.Linking;
      fromEntityId: string;
      fromAnchor: Anchor;
      /** punto actual del cursor mientras se dibuja la relación */
      current?: Point; // <-- añadir esto
    };
