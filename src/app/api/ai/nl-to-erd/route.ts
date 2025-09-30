import { NextResponse } from "next/server";
import { gemini, modelName } from "../../../../lib/gemini";

type AiRequest = { prompt: string };

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as AiRequest;

    const system = `
Eres un asistente que convierte una descripción en lenguaje natural a un esquema Entidad-Relación minimalista.
Devuelve SOLO JSON con este shape:

{
  "entities": [
    {
      "name": "NombreEntidad",
      "attributes": [
        { "name": "id", "type": "long", "pk": true, "required": true },
        { "name": "campo", "type": "string", "required": false }
      ]
    }
  ],
  "relations": [
    {
      "sourceName": "EntidadA",
      "targetName": "EntidadB",
      "sourceCard": "ONE"|"MANY",
      "targetCard": "ONE"|"MANY",
      "owningSide": "source"|"target"
    }
  ]
}

Reglas:
- Incluye SIEMPRE un atributo PK 'id' (long, required) en cada entidad.
- Entidades en PascalCase; atributos en camelCase.
- Si ves N–N, puedes sugerir una entidad puente.
- Si dudas, owningSide="target".
`.trim();

    // En v1.20 la forma correcta es models.generateContent
    const result = await gemini.models.generateContent({
      model: modelName,
      contents: `${system}\n\nDescripción:\n${prompt}`,
      // NOTA: si TypeScript protesta por alguna propiedad del config, puedes
      // quitarla o castear el objeto a any.
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      } as any,
    });

    const text = extractTextV120(result);

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "La IA no devolvió JSON válido", raw: text },
        { status: 502 }
      );
    }

    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}

/** Extrae texto robustamente para @google/genai v1.20 */
function extractTextV120(res: any): string {
  // Doc de 1.20 muestra "response.text" o "response.text()".
  if (typeof res?.text === "string") return res.text;
  if (typeof res?.text === "function") return res.text();
  if (typeof res?.response?.text === "function") return res.response.text();
  if (typeof res?.response?.text === "string") return res.response.text;

  // Fallback: candidates -> content -> parts -> text
  const parts = res?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const txt = parts.map((p: any) => p?.text ?? "").join("");
    if (txt) return txt;
  }
  return "";
}
