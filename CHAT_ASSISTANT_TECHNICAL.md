# 🔧 Chat Assistant - Documentación Técnica

## 📐 Arquitectura

```
┌─────────────────────────────────────────────┐
│          ChatAssistant.tsx (UI)             │
│  - Interfaz de usuario del chat            │
│  - Manejo de mensajes                       │
│  - Botón flotante                           │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────┐
│       useDiagramChat.ts (Hook)              │
│  - Lógica del chat                          │
│  - Gestión de estado de mensajes           │
│  - Orquestación de operaciones             │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────┐
│     gemini-diagram.ts (IA Integration)      │
│  - Comunicación con Gemini API              │
│  - Parsing de respuestas                    │
│  - Validación de operaciones                │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────┐
│   diagram-operations.ts (CRUD Operations)   │
│  - addEntityOperation()                     │
│  - removeEntityOperation()                  │
│  - addAttributeOperation()                  │
│  - addRelationOperation()                   │
│  - etc...                                   │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────┐
│         Liveblocks Storage                  │
│  - Estado compartido en tiempo real         │
│  - Sincronización multi-usuario             │
│  - Historial de cambios (undo/redo)        │
└─────────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos

```
src/
├── components/
│   └── chat/
│       └── ChatAssistant.tsx          # Componente principal del chat
│
├── hooks/
│   └── useDiagramChat.ts              # Hook personalizado
│
├── lib/
│   └── gemini-diagram.ts              # Integración con Gemini
│
└── utils/
    └── diagram-operations.ts          # Operaciones CRUD
```

---

## 🔄 Flujo de Ejecución

### 1. **Usuario Envía Mensaje**
```typescript
// ChatAssistant.tsx
const handleSubmit = async (e: React.FormEvent) => {
  await sendMessage(inputValue);
};
```

### 2. **Hook Captura Contexto**
```typescript
// useDiagramChat.ts
const context: DiagramContext = {
  entities: entities || [],
  relations: relations || [],
};
```

### 3. **Análisis con Gemini**
```typescript
// gemini-diagram.ts
const response = await analyzeUserIntent(text, context);
// Retorna: { operations: [...], explanation: "...", success: true }
```

### 4. **Validación de Operaciones**
```typescript
const validation = validateOperation(operation, context);
if (!validation.valid) {
  errors.push(validation.error);
  continue;
}
```

### 5. **Ejecución con Liveblocks**
```typescript
await executeOperation(operation);
// Ejecuta mutation que modifica el storage
```

### 6. **Actualización del Canvas**
```typescript
// Liveblocks sincroniza automáticamente
// El canvas se actualiza en tiempo real
```

---

## 🎯 Tipos Principales

### **DiagramContext**
```typescript
type DiagramContext = {
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
```

### **DiagramOperation**
```typescript
type DiagramOperation =
  | { type: "ADD_ENTITY"; name: string; attributes: [...] }
  | { type: "REMOVE_ENTITY"; entityName: string }
  | { type: "ADD_ATTRIBUTE"; entityName: string; attribute: {...} }
  | { type: "REMOVE_ATTRIBUTE"; entityName: string; attributeName: string }
  | { type: "MODIFY_ATTRIBUTE"; entityName: string; attributeName: string; changes: {...} }
  | { type: "ADD_RELATION"; sourceEntity: string; targetEntity: string; ... }
  | { type: "REMOVE_RELATION"; sourceEntity: string; targetEntity: string }
  | { type: "MODIFY_ENTITY"; entityName: string; newName?: string };
```

### **ChatMessage**
```typescript
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  success?: boolean;
};
```

---

## 🤖 Integración con Gemini

### **Prompt Engineering**

El prompt está estructurado en secciones:

1. **Rol del asistente**
2. **Contexto actual del diagrama**
3. **Operaciones disponibles con ejemplos**
4. **Tipos de datos y relaciones válidos**
5. **Instrucciones específicas**
6. **Comando del usuario**
7. **Formato de respuesta esperado**

```typescript
const prompt = `
Eres un asistente especializado en modificar diagramas UML/ERD.

=== CONTEXTO ACTUAL ===
${formatDiagramContext(context)}

=== OPERACIONES ===
1. ADD_ENTITY: {...}
2. REMOVE_ENTITY: {...}
...

=== COMANDO ===
"${userMessage}"

=== RESPUESTA (SOLO JSON) ===
`;
```

### **Parsing de Respuestas**

```typescript
// Extraer JSON de la respuesta
const jsonMatch = text.match(/\{[\s\S]*\}/);
const parsed = JSON.parse(jsonMatch[0]) as GeminiDiagramResponse;
```

---

## 🛠️ Operaciones CRUD

### **addEntityOperation**
```typescript
function addEntityOperation(
  storage: DiagramStorage,
  name: string,
  attributes: Omit<DBAttribute, "id">[],
  position?: { x: number; y: number }
)
```

**Parámetros:**
- `storage`: Storage de Liveblocks
- `name`: Nombre de la entidad
- `attributes`: Array de atributos
- `position`: Posición en el canvas (opcional)

**Retorna:** `{ id: string, entity: EntityLayer }`

### **addAttributeOperation**
```typescript
function addAttributeOperation(
  storage: DiagramStorage,
  entityId: string,
  attribute: Omit<DBAttribute, "id">
)
```

### **addRelationOperation**
```typescript
function addRelationOperation(
  storage: DiagramStorage,
  sourceId: string,
  targetId: string,
  relationType: RelationType = "association",
  options?: {
    sourceCard?: "ONE" | "MANY";
    targetCard?: "ONE" | "MANY";
    owningSide?: "source" | "target";
  }
)
```

---

## 🔍 Validaciones

### **validateOperation**

Verifica que una operación sea válida antes de ejecutarla:

```typescript
const validation = validateOperation(operation, context);
// Retorna: { valid: boolean; error?: string }
```

**Validaciones implementadas:**

- ✅ No crear entidades duplicadas
- ✅ No eliminar entidades inexistentes
- ✅ No añadir atributos duplicados
- ✅ No crear relaciones con entidades inexistentes
- ✅ No renombrar a un nombre ya existente

---

## 🎨 Componentes UI

### **ChatAssistant**

**Props:** Ninguno

**Estado:**
- `isOpen`: Controla visibilidad del panel
- `inputValue`: Valor del textarea
- `messages`: Array de mensajes
- `isProcessing`: Indica si está procesando

**Características:**
- Botón flotante
- Panel deslizante
- Auto-scroll de mensajes
- Indicador de "escribiendo..."
- Sugerencias rápidas
- Contador de caracteres

### **ChatMessageBubble**

**Props:**
- `message: ChatMessage`

**Características:**
- Avatar diferenciado (usuario vs IA)
- Colores según rol y estado
- Timestamp formateado
- Soporte para texto multilínea

---

## ⚡ Optimizaciones

### **1. Batch de Operaciones**
Las operaciones se ejecutan en secuencia pero dentro de una sola mutation:

```typescript
for (const operation of response.operations) {
  await executeOperation(operation);
}
```

### **2. Validación Temprana**
Se valida antes de ejecutar para evitar operaciones inválidas:

```typescript
if (!validation.valid) {
  errors.push(validation.error);
  continue; // No ejecuta la operación
}
```

### **3. Contexto Actualizado**
Después de cada operación, el contexto se actualiza para las siguientes:

```typescript
if (operation.type === "ADD_ENTITY") {
  context.entities.push({...});
}
```

---

## 🐛 Manejo de Errores

### **Niveles de Error**

1. **Error de Gemini API**
```typescript
catch (error) {
  return {
    operations: [],
    explanation: `Error: ${error.message}`,
    success: false,
  };
}
```

2. **Error de Validación**
```typescript
if (!validation.valid) {
  errors.push(validation.error);
}
```

3. **Error de Ejecución**
```typescript
try {
  await executeOperation(op);
} catch (error) {
  errors.push(`Error al ejecutar ${op.type}`);
}
```

### **Feedback al Usuario**

```typescript
const assistantMessage: ChatMessage = {
  role: "assistant",
  content: executed.length > 0 
    ? `✅ ${explanation}\n\n${executed.join('\n')}`
    : `⚠️ Errores:\n${errors.join('\n')}`,
  success: executed.length > 0,
};
```

---

## 🔐 Seguridad

### **Validación de Entrada**
- Máximo 500 caracteres por mensaje
- Sanitización de nombres de entidades
- Validación de tipos de datos

### **Rate Limiting**
- `isProcessing` previene spam
- Un mensaje a la vez

### **Validación de Operaciones**
- Todas las operaciones se validan antes de ejecutar
- No se permite crear duplicados
- No se puede eliminar lo que no existe

---

## 📊 Performance

### **Métricas Esperadas**

| Métrica | Valor Esperado |
|---------|----------------|
| Tiempo de respuesta Gemini | 1-3 segundos |
| Tiempo de ejecución operación | < 100ms |
| Memoria por mensaje | ~1KB |
| Límite de mensajes en historial | Ilimitado (se puede implementar límite) |

### **Optimizaciones Futuras**

- [ ] Cache de respuestas comunes
- [ ] Batch de operaciones similares
- [ ] Streaming de respuestas de Gemini
- [ ] Lazy loading de historial
- [ ] Compresión de mensajes antiguos

---

## 🧪 Testing

### **Unit Tests Recomendados**

```typescript
describe('diagram-operations', () => {
  test('addEntityOperation crea entidad correctamente', () => {
    // ...
  });
  
  test('no permite crear entidades duplicadas', () => {
    // ...
  });
});

describe('gemini-diagram', () => {
  test('parseResponse extrae JSON correctamente', () => {
    // ...
  });
  
  test('validateOperation detecta errores', () => {
    // ...
  });
});
```

### **Integration Tests**

```typescript
describe('useDiagramChat', () => {
  test('ejecuta comando completo end-to-end', async () => {
    // 1. Enviar mensaje
    // 2. Verificar análisis de Gemini
    // 3. Verificar validación
    // 4. Verificar ejecución
    // 5. Verificar actualización de canvas
  });
});
```

---

## 🚀 Despliegue

### **Variables de Entorno Requeridas**

```env
GEMINI_API_KEY=your_api_key_here
```

### **Configuración de Producción**

```typescript
// src/lib/gemini.ts
export const modelName = process.env.NODE_ENV === 'production'
  ? "gemini-2.0-flash-exp"  // Más rápido
  : "gemini-1.5-flash";      // Más económico para dev
```

---

## 📈 Monitoring

### **Métricas a Trackear**

- Número de mensajes por sesión
- Tasa de éxito de operaciones
- Tiempo de respuesta de Gemini
- Errores más comunes
- Comandos más utilizados

### **Logging**

```typescript
console.log('[Chat] Mensaje enviado:', text);
console.log('[Chat] Operaciones generadas:', operations.length);
console.log('[Chat] Errores:', errors);
```

---

## 🔄 Extensibilidad

### **Añadir Nueva Operación**

1. **Agregar tipo en gemini-diagram.ts**
```typescript
type DiagramOperation = ... | { type: "NEW_OPERATION"; ... }
```

2. **Implementar función en diagram-operations.ts**
```typescript
export function newOperation(storage, ...) { ... }
```

3. **Agregar case en useDiagramChat.ts**
```typescript
case "NEW_OPERATION": {
  newOperation(storage, ...);
  break;
}
```

4. **Actualizar prompt en gemini-diagram.ts**
```
9. NEW_OPERATION: Descripción
   Ejemplo: { "type": "NEW_OPERATION", ... }
```

---

## 💡 Best Practices

### **DO ✅**
- Validar antes de ejecutar
- Proporcionar feedback claro al usuario
- Manejar todos los casos de error
- Mantener el contexto actualizado
- Usar tipos estrictos de TypeScript

### **DON'T ❌**
- Ejecutar operaciones sin validar
- Confiar ciegamente en la respuesta de Gemini
- Permitir operaciones que rompan el diagrama
- Ignorar errores silenciosamente
- Usar `any` sin necesidad

---

## 📚 Referencias

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Liveblocks Documentation](https://liveblocks.io/docs)
- [UML Relationship Types](https://www.uml-diagrams.org/relationship.html)

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025  
**Mantenedor:** Tu Equipo de Desarrollo
