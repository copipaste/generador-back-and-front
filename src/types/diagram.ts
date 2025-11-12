import type { RelationType } from "~/types";

/**
 * Contexto del diagrama actual para enviar a Gemini
 */
export type DiagramContext = {
  entities: Array<{
    id: string;
    name: string;
    attributes: Array<{
      name: string;
      type: string;
      required?: boolean;
      pk?: boolean;
    }>;
  }>;
  relations: Array<{
    id: string;
    source: string;
    target: string;
    type: RelationType;
    sourceCard: string;
    targetCard: string;
  }>;
};

/**
 * Tipos de operaciones que puede realizar el asistente
 */
export type DiagramOperation =
  | {
      type: "ADD_ENTITY";
      name: string;
      attributes: Array<{
        name: string;
        type: string;
        required?: boolean;
        pk?: boolean;
      }>;
    }
  | {
      type: "REMOVE_ENTITY";
      entityName: string;
    }
  | {
      type: "ADD_ATTRIBUTE";
      entityName: string;
      attribute: {
        name: string;
        type: string;
        required?: boolean;
        pk?: boolean;
      };
    }
  | {
      type: "REMOVE_ATTRIBUTE";
      entityName: string;
      attributeName: string;
    }
  | {
      type: "MODIFY_ATTRIBUTE";
      entityName: string;
      attributeName: string;
      changes: {
        name?: string;
        type?: string;
        required?: boolean;
        pk?: boolean;
      };
    }
  | {
      type: "ADD_RELATION";
      sourceEntity: string;
      targetEntity: string;
      relationType?: RelationType;
      sourceCard?: "ONE" | "MANY";
      targetCard?: "ONE" | "MANY";
    }
  | {
      type: "REMOVE_RELATION";
      sourceEntity: string;
      targetEntity: string;
    }
  | {
      type: "MODIFY_ENTITY";
      entityName: string;
      newName?: string;
    };

/**
 * Respuesta estructurada de Gemini
 */
export type GeminiDiagramResponse = {
  operations: DiagramOperation[];
  explanation: string;
  success: boolean;
};
