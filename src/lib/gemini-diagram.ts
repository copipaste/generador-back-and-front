import { gemini } from "./gemini";
import type {
  DiagramContext,
  DiagramOperation,
  GeminiDiagramResponse,
} from "~/types/diagram";
import { validateOperation } from "~/utils/diagram-validation";

// Re-exportar los tipos y función para compatibilidad
export type { DiagramContext, DiagramOperation, GeminiDiagramResponse };
export { validateOperation };

/**
 * Analiza el mensaje del usuario con Gemini y devuelve operaciones a ejecutar
 */
export async function analyzeUserIntent(
  userMessage: string,
  context: DiagramContext
): Promise<GeminiDiagramResponse> {
  const prompt = buildPromptForGemini(userMessage, context);

  try {
    const result = await gemini.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });
    const text = result.text || "";

    // Limpiar el texto para extraer solo el JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se pudo extraer JSON de la respuesta");
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeminiDiagramResponse;
    
    // Validar que tenga la estructura correcta
    if (!parsed.operations || !Array.isArray(parsed.operations)) {
      throw new Error("Respuesta inválida: falta el array de operaciones");
    }

    return {
      ...parsed,
      success: true,
    };
  } catch (error) {
    console.error("Error al analizar con Gemini:", error);
    return {
      operations: [],
      explanation: `Lo siento, no pude entender tu comando. Error: ${error instanceof Error ? error.message : "desconocido"}`,
      success: false,
    };
  }
}

/**
 * Construye el prompt estructurado para Gemini
 */
function buildPromptForGemini(
  userMessage: string,
  context: DiagramContext
): string {
  return `Eres un asistente especializado en modificar diagramas UML/ERD.
Tu tarea es analizar el comando del usuario y generar un JSON con las operaciones a realizar sobre el diagrama.

=== CONTEXTO ACTUAL DEL DIAGRAMA ===
${formatDiagramContext(context)}

=== OPERACIONES DISPONIBLES ===

1. ADD_ENTITY: Añadir nueva entidad/tabla/clase
   Ejemplo: { "type": "ADD_ENTITY", "name": "Usuario", "attributes": [{"name": "id", "type": "long", "pk": true}, {"name": "email", "type": "string"}] }

2. REMOVE_ENTITY: Eliminar entidad existente
   Ejemplo: { "type": "REMOVE_ENTITY", "entityName": "Usuario" }

3. ADD_ATTRIBUTE: Añadir atributo/campo a una entidad
   Ejemplo: { "type": "ADD_ATTRIBUTE", "entityName": "Usuario", "attribute": {"name": "telefono", "type": "string", "required": false} }

4. REMOVE_ATTRIBUTE: Quitar atributo de entidad
   Ejemplo: { "type": "REMOVE_ATTRIBUTE", "entityName": "Usuario", "attributeName": "telefono" }

5. MODIFY_ATTRIBUTE: Modificar atributo existente
   Ejemplo: { "type": "MODIFY_ATTRIBUTE", "entityName": "Usuario", "attributeName": "edad", "changes": {"type": "int", "required": true} }

6. ADD_RELATION: Crear relación entre entidades
   Ejemplo: { "type": "ADD_RELATION", "sourceEntity": "Usuario", "targetEntity": "Pedido", "relationType": "association", "sourceCard": "ONE", "targetCard": "MANY" }

7. REMOVE_RELATION: Eliminar relación
   Ejemplo: { "type": "REMOVE_RELATION", "sourceEntity": "Usuario", "targetEntity": "Pedido" }

8. MODIFY_ENTITY: Cambiar nombre de entidad
   Ejemplo: { "type": "MODIFY_ENTITY", "entityName": "Usuario", "newName": "Cliente" }

=== TIPOS DE DATOS VÁLIDOS ===
string, int, long, float, double, boolean, date, datetime, uuid, email, password

=== TIPOS DE RELACIONES UML VÁLIDOS ===
- association (línea simple)
- aggregation (diamante vacío)
- composition (diamante lleno)
- generalization (herencia)
- realization (implementación)
- dependency (dependencia)

=== CARDINALIDADES VÁLIDAS ===
ONE, MANY

=== INSTRUCCIONES ===
1. Analiza el comando del usuario
2. Identifica qué operaciones se deben realizar
3. Si el usuario menciona una entidad que no existe, créala primero
4. Si faltan detalles (tipo de dato, cardinalidad), usa valores por defecto razonables:
   - Tipo de dato por defecto: "string"
   - PK por defecto: false
   - Required por defecto: false
   - Relación por defecto: "association"
   - Cardinalidad por defecto: ONE-MANY
5. Genera un JSON válido con este formato EXACTO:

{
  "operations": [
    // Array de operaciones a realizar
  ],
  "explanation": "Descripción clara de lo que se hizo",
  "success": true
}

=== COMANDO DEL USUARIO ===
"${userMessage}"

=== RESPUESTA (SOLO JSON, SIN TEXTO ADICIONAL) ===`;
}

/**
 * Formatea el contexto del diagrama para el prompt
 */
function formatDiagramContext(context: DiagramContext): string {
  if (context.entities.length === 0) {
    return "El diagrama está vacío. No hay entidades ni relaciones.";
  }

  let formatted = "ENTIDADES:\n";
  context.entities.forEach((entity) => {
    formatted += `- ${entity.name}\n`;
    if (entity.attributes.length > 0) {
      entity.attributes.forEach((attr) => {
        const flags = [];
        if (attr.pk) flags.push("PK");
        if (attr.required) flags.push("required");
        const flagStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
        formatted += `  * ${attr.name}: ${attr.type}${flagStr}\n`;
      });
    } else {
      formatted += `  (sin atributos)\n`;
    }
  });

  if (context.relations.length > 0) {
    formatted += "\nRELACIONES:\n";
    context.relations.forEach((rel) => {
      formatted += `- ${rel.source} (${rel.sourceCard}) --[${rel.type}]--> (${rel.targetCard}) ${rel.target}\n`;
    });
  } else {
    formatted += "\nNo hay relaciones definidas.\n";
  }

  return formatted;
}
