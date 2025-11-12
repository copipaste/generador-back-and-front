import { useCallback, useState } from "react";
import { useMutation, useStorage } from "@liveblocks/react";
import type {
  DiagramContext,
  DiagramOperation,
  GeminiDiagramResponse,
} from "~/types/diagram";
import { validateOperation } from "~/utils/diagram-validation";
import {
  addEntityOperation,
  removeEntityOperation,
  addAttributeOperation,
  removeAttributeOperation,
  modifyAttributeOperation,
  addRelationOperation,
  removeRelationOperation,
  findEntityByName,
  getAllEntities,
  getAllRelations,
} from "~/utils/diagram-operations";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  success?: boolean;
};

/**
 * Hook personalizado para el chat del diagrama
 */
export function useDiagramChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 ¡Hola! Soy tu asistente de diagramas. Puedo ayudarte a modificar tu diagrama con comandos como:\n\n" +
        "• 'Añade un atributo correo a Persona'\n" +
        "• 'Crea una clase Casa con atributo dirección'\n" +
        "• 'Relaciona Persona con Casa'\n" +
        "• 'Elimina el atributo edad de Persona'\n" +
        "• 'Borra la tabla Usuario'\n\n" +
        "¿En qué puedo ayudarte?",
      timestamp: new Date(),
      success: true,
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  // Obtener contexto actual del diagrama
  const entities = useStorage((root) => {
    const layers = root.layers;
    const layerIds = root.layerIds;
    const result: DiagramContext["entities"] = [];

    if (!layerIds) return result;

    for (let i = 0; i < layerIds.length; i++) {
      const id = layerIds[i];
      if (!id) continue;
      
      const layer = layers.get(id);

      if (layer?.type === "Entity") {
        result.push({
          id,
          name: layer.name,
          attributes: (layer.attributes || []).map((attr: any) => ({
            name: attr.name,
            type: attr.type || "string",
            required: attr.required,
            pk: attr.pk,
          })),
        });
      }
    }

    return result;
  });

  const relations = useStorage((root) => {
    const layers = root.layers;
    const layerIds = root.layerIds;
    const result: DiagramContext["relations"] = [];

    if (!layerIds) return result;

    for (let i = 0; i < layerIds.length; i++) {
      const id = layerIds[i];
      if (!id) continue;
      
      const layer = layers.get(id);

      if (layer?.type === "Relation") {
        const sourceLayer: any = layers.get(layer.sourceId);
        const targetLayer: any = layers.get(layer.targetId);

        if (sourceLayer && targetLayer) {
          result.push({
            id,
            source: sourceLayer.name || layer.sourceId,
            target: targetLayer.name || layer.targetId,
            type: layer.relationType,
            sourceCard: layer.sourceCard,
            targetCard: layer.targetCard,
          });
        }
      }
    }

    return result;
  });

  // Ejecutar una operación individual
  const executeOperation = useMutation(
    ({ storage }, operation: DiagramOperation) => {
      try {
        switch (operation.type) {
          case "ADD_ENTITY": {
            addEntityOperation(storage, operation.name, operation.attributes as any);
            break;
          }

          case "REMOVE_ENTITY": {
            const entity = findEntityByName(storage, operation.entityName);
            if (entity) {
              removeEntityOperation(storage, entity.id);
            }
            break;
          }

          case "ADD_ATTRIBUTE": {
            const entity = findEntityByName(storage, operation.entityName);
            if (entity) {
              addAttributeOperation(storage, entity.id, operation.attribute as any);
            }
            break;
          }

          case "REMOVE_ATTRIBUTE": {
            const entity = findEntityByName(storage, operation.entityName);
            if (entity) {
              removeAttributeOperation(
                storage,
                entity.id,
                operation.attributeName
              );
            }
            break;
          }

          case "MODIFY_ATTRIBUTE": {
            const entity = findEntityByName(storage, operation.entityName);
            if (entity) {
              modifyAttributeOperation(
                storage,
                entity.id,
                operation.attributeName,
                operation.changes as any
              );
            }
            break;
          }

          case "ADD_RELATION": {
            const sourceEntity = findEntityByName(
              storage,
              operation.sourceEntity
            );
            const targetEntity = findEntityByName(
              storage,
              operation.targetEntity
            );

            if (sourceEntity && targetEntity) {
              addRelationOperation(
                storage,
                sourceEntity.id,
                targetEntity.id,
                operation.relationType || "association",
                {
                  sourceCard: operation.sourceCard || "ONE",
                  targetCard: operation.targetCard || "MANY",
                  owningSide: "target",
                }
              );
            }
            break;
          }

          case "REMOVE_RELATION": {
            const allRelations = getAllRelations(storage);
            const sourceEntity = findEntityByName(
              storage,
              operation.sourceEntity
            );
            const targetEntity = findEntityByName(
              storage,
              operation.targetEntity
            );

            if (sourceEntity && targetEntity) {
              const relation = allRelations.find(
                (r: any) =>
                  r.relation.sourceId === sourceEntity.id &&
                  r.relation.targetId === targetEntity.id
              );

              if (relation) {
                removeRelationOperation(storage, relation.id);
              }
            }
            break;
          }

          case "MODIFY_ENTITY": {
            const entity = findEntityByName(storage, operation.entityName);
            if (entity && operation.newName) {
              const layers = storage.get("layers");
              const layer = layers.get(entity.id);
              if (layer) {
                layer.update({ name: operation.newName });
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error("Error ejecutando operación:", error);
        throw error;
      }
    },
    []
  );

  // Procesar mensaje del usuario
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing) return;

      // Añadir mensaje del usuario
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsProcessing(true);

      try {
        // Obtener contexto actual
        const context: DiagramContext = {
          entities: entities || [],
          relations: relations || [],
        };

        // Analizar con Gemini usando API
        const apiResponse = await fetch("/api/ai/analyze-diagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userMessage: text, context }),
        });

        if (!apiResponse.ok) {
          throw new Error(`Error en API: ${apiResponse.statusText}`);
        }

        const response = (await apiResponse.json()) as GeminiDiagramResponse;

        if (!response.success || response.operations.length === 0) {
          // Error o no hay operaciones
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response.explanation,
            timestamp: new Date(),
            success: false,
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsProcessing(false);
          return;
        }

        // Validar y ejecutar operaciones
        const errors: string[] = [];
        const executed: string[] = [];

        for (const operation of response.operations) {
          // Validar operación
          const validation = validateOperation(operation, context);

          if (!validation.valid) {
            errors.push(validation.error || "Error desconocido");
            continue;
          }

          try {
            // Ejecutar operación
            await executeOperation(operation);
            executed.push(getOperationDescription(operation));

            // Actualizar contexto para próximas operaciones
            if (operation.type === "ADD_ENTITY") {
              context.entities.push({
                id: "temp-" + Date.now(),
                name: operation.name,
                attributes: operation.attributes,
              });
            }
          } catch (error) {
            errors.push(
              `Error al ejecutar ${operation.type}: ${error instanceof Error ? error.message : "desconocido"}`
            );
          }
        }

        // Generar mensaje de respuesta
        let assistantContent = "";
        if (executed.length > 0) {
          assistantContent = `✅ ${response.explanation}\n\nOperaciones realizadas:\n${executed.map((e) => `• ${e}`).join("\n")}`;
        }
        if (errors.length > 0) {
          assistantContent += `\n\n⚠️ Errores:\n${errors.map((e) => `• ${e}`).join("\n")}`;
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: assistantContent,
          timestamp: new Date(),
          success: executed.length > 0,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error procesando mensaje:", error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 3).toString(),
          role: "assistant",
          content: `❌ Error: ${error instanceof Error ? error.message : "Error desconocido"}`,
          timestamp: new Date(),
          success: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [entities, relations, executeOperation, isProcessing]
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 ¡Hola! Soy tu asistente de diagramas. ¿En qué puedo ayudarte?",
        timestamp: new Date(),
        success: true,
      },
    ]);
  }, []);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearMessages,
  };
}

/**
 * Genera una descripción legible de una operación
 */
function getOperationDescription(operation: DiagramOperation): string {
  switch (operation.type) {
    case "ADD_ENTITY":
      return `Entidad "${operation.name}" creada con ${operation.attributes.length} atributos`;
    case "REMOVE_ENTITY":
      return `Entidad "${operation.entityName}" eliminada`;
    case "ADD_ATTRIBUTE":
      return `Atributo "${operation.attribute.name}" añadido a "${operation.entityName}"`;
    case "REMOVE_ATTRIBUTE":
      return `Atributo "${operation.attributeName}" eliminado de "${operation.entityName}"`;
    case "MODIFY_ATTRIBUTE":
      return `Atributo "${operation.attributeName}" modificado en "${operation.entityName}"`;
    case "ADD_RELATION":
      return `Relación creada: ${operation.sourceEntity} → ${operation.targetEntity}`;
    case "REMOVE_RELATION":
      return `Relación eliminada: ${operation.sourceEntity} → ${operation.targetEntity}`;
    case "MODIFY_ENTITY":
      return `Entidad "${operation.entityName}" renombrada a "${operation.newName}"`;
    default:
      return "Operación realizada";
  }
}
