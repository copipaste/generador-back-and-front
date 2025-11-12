import { NextResponse } from "next/server";
import { analyzeUserIntent, type DiagramContext } from "~/lib/gemini-diagram";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      userMessage: string;
      context: DiagramContext;
    };

    const { userMessage, context } = body;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "Se requiere el campo 'userMessage' como string" },
        { status: 400 }
      );
    }

    if (!context || typeof context !== "object") {
      return NextResponse.json(
        { error: "Se requiere el campo 'context' como objeto" },
        { status: 400 }
      );
    }

    // Analizar el mensaje con Gemini
    const response = await analyzeUserIntent(userMessage, context);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error en analyze-diagram API:", error);
    return NextResponse.json(
      {
        operations: [],
        explanation: `Error al procesar tu comando: ${error instanceof Error ? error.message : "Error desconocido"}`,
        success: false,
      },
      { status: 500 }
    );
  }
}
