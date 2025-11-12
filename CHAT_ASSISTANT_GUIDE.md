# 🤖 Asistente de Chat con IA - Guía de Uso

## ✨ Descripción

El **Asistente de Chat con IA** es una funcionalidad poderosa que te permite modificar tu diagrama UML/ERD usando comandos en lenguaje natural. Powered by **Gemini AI**, entiende tus instrucciones y las ejecuta automáticamente sobre el canvas.

---

## 🚀 Cómo Usar

### 1. **Abrir el Chat**
- Busca el **botón flotante morado con icono de chat** en la esquina inferior derecha
- Haz clic para abrir el panel de chat

### 2. **Escribir Comandos**
Escribe tus instrucciones en lenguaje natural. El asistente entiende múltiples formas de expresar la misma acción.

---

## 📝 Ejemplos de Comandos

### 🆕 **Crear Entidades**

```
✅ "Crea una tabla Persona"
✅ "Añade una clase Usuario con atributos nombre y email"
✅ "Crea una entidad Casa con dirección y precio"
```

### ➕ **Añadir Atributos**

```
✅ "Añade un atributo correo a Persona"
✅ "Agrega el campo telefono de tipo string a Usuario"
✅ "Añade edad (tipo int, requerido) a Persona"
```

### 🗑️ **Eliminar Atributos**

```
✅ "Elimina el atributo edad de Persona"
✅ "Quita el campo telefono de Usuario"
✅ "Borra correo de la tabla Persona"
```

### 🔗 **Crear Relaciones**

```
✅ "Relaciona Persona con Casa"
✅ "Crea una relación entre Usuario y Pedido"
✅ "Conecta Persona (uno) con Casa (muchos)"
✅ "Agrega una relación de composición entre Casa y Habitación"
```

### ✏️ **Modificar Atributos**

```
✅ "Cambia el tipo de edad a int en Persona"
✅ "Marca el campo email como requerido en Usuario"
✅ "Haz que id sea clave primaria en Persona"
```

### 🔄 **Renombrar Entidades**

```
✅ "Renombra Persona a Cliente"
✅ "Cambia el nombre de Usuario a Empleado"
```

### ❌ **Eliminar Entidades**

```
✅ "Elimina la tabla Usuario"
✅ "Borra la entidad Casa"
✅ "Quita la clase Pedido"
```

---

## 🎯 Tipos de Datos Soportados

Cuando crees atributos, puedes especificar estos tipos:

- `string` - Texto (por defecto)
- `int` - Número entero
- `long` - Número entero largo
- `float` - Decimal
- `double` - Decimal de doble precisión
- `boolean` - Verdadero/Falso
- `date` - Fecha
- `datetime` - Fecha y hora
- `uuid` - Identificador único
- `email` - Correo electrónico
- `password` - Contraseña

---

## 🔗 Tipos de Relaciones UML

Puedes especificar diferentes tipos de relaciones:

- **association** - Asociación simple (línea)
- **aggregation** - Agregación (diamante vacío)
- **composition** - Composición (diamante lleno)
- **generalization** - Herencia (triángulo vacío)
- **realization** - Implementación (línea punteada)
- **dependency** - Dependencia (flecha punteada)

**Ejemplos:**
```
"Crea una relación de composición entre Casa y Habitación"
"Agrega una herencia de Persona a Estudiante"
"Añade una dependencia entre Servicio y Utilidad"
```

---

## 💡 Tips y Trucos

### ✅ **Comandos Compuestos**
Puedes hacer múltiples cosas en un solo comando:

```
"Crea una clase Producto con atributos nombre, precio de tipo float y stock de tipo int"
```

### ✅ **Lenguaje Natural**
No necesitas sintaxis exacta. El asistente entiende variaciones:

- "Añade" = "Agrega" = "Crea" = "Inserta"
- "Elimina" = "Borra" = "Quita" = "Remueve"
- "Tabla" = "Clase" = "Entidad"
- "Campo" = "Atributo" = "Propiedad"

### ✅ **Contexto Inteligente**
El asistente conoce tu diagrama actual y valida:

- No puedes añadir una entidad que ya existe
- No puedes eliminar un atributo que no existe
- No puedes relacionar entidades que no existen

### ✅ **Corrección de Errores**
Si algo sale mal, el asistente te explicará qué pasó:

```
⚠️ "La entidad 'Usuario' no existe. ¿Quieres crearla primero?"
```

---

## 🎨 Interfaz del Chat

### **Botones Principales:**

- 🗑️ **Limpiar** - Borra el historial de conversación
- ❌ **Cerrar** - Oculta el panel de chat
- 📤 **Enviar** - Ejecuta el comando

### **Indicadores:**

- 🟢 Mensaje con **✅** - Operación exitosa
- 🔴 Mensaje con **⚠️** - Error o advertencia
- ⚪ Puntos animados - El asistente está procesando

### **Sugerencias Rápidas:**

Haz clic en las burbujas de sugerencias para usar comandos comunes rápidamente.

---

## 🔄 Flujo de Trabajo Recomendado

### **1. Crear Estructura Base**
```
"Crea una tabla Persona con id, nombre y email"
"Crea una tabla Casa con id y dirección"
```

### **2. Añadir Detalles**
```
"Añade edad de tipo int a Persona"
"Añade precio de tipo float a Casa"
"Marca id como clave primaria en Persona"
```

### **3. Establecer Relaciones**
```
"Relaciona Persona (uno) con Casa (muchos)"
```

### **4. Refinar**
```
"Cambia el tipo de edad a long"
"Renombra Persona a Cliente"
```

---

## 🐛 Solución de Problemas

### ❌ **"El asistente no responde"**
- Verifica que tengas conexión a internet (Gemini AI requiere conexión)
- Revisa la consola del navegador para errores de API

### ❌ **"No reconoce mi comando"**
- Intenta ser más específico
- Usa nombres exactos de las entidades existentes
- Prueba con uno de los ejemplos de esta guía

### ❌ **"Error al ejecutar operación"**
- Verifica que la entidad exista antes de modificarla
- Revisa que no haya nombres duplicados
- Comprueba que los tipos de datos sean válidos

---

## 🚀 Casos de Uso Avanzados

### **Migración de Esquema**
```
"Renombra Usuario a Cliente"
"Añade campo fecha_registro a Cliente"
"Elimina el campo contraseña_antigua"
```

### **Diseño Iterativo**
```
"Crea Pedido con numero, fecha y total"
"Relaciona Cliente con Pedido (uno a muchos)"
"Añade estado de tipo string a Pedido"
```

### **Modelado Rápido**
```
"Crea Sistema con nombre y version"
"Crea Módulo con nombre y descripción"
"Relaciona Sistema con Módulo (composición)"
```

---

## 📊 Ventajas del Asistente

✅ **Rapidez** - Modifica el diagrama 10x más rápido que manualmente  
✅ **Precisión** - Valida las operaciones antes de ejecutarlas  
✅ **Inteligente** - Entiende contexto y sinónimos  
✅ **Reversible** - Usa Ctrl+Z para deshacer cambios  
✅ **Educativo** - Te explica qué hizo en cada paso  

---

## 🎓 Aprende Más

### **Atajos de Teclado:**
- `Enter` - Enviar mensaje
- `Shift + Enter` - Nueva línea
- `Ctrl + Z` - Deshacer último cambio

### **Límites:**
- Máximo 500 caracteres por mensaje
- El asistente procesa comandos secuencialmente
- Las operaciones complejas se dividen en pasos

---

## 💬 Ejemplos de Conversaciones Reales

### **Ejemplo 1: Crear un Sistema Básico**
```
👤 Tú: "Crea una tabla Persona con nombre y edad"
🤖 IA: "✅ He creado la entidad 'Persona' con 2 atributos"

👤 Tú: "Añade correo de tipo email"
🤖 IA: "✅ Atributo 'correo' añadido a 'Persona'"

👤 Tú: "Marca correo como requerido"
🤖 IA: "✅ Atributo 'correo' modificado en 'Persona'"
```

### **Ejemplo 2: Establecer Relaciones**
```
👤 Tú: "Crea una clase Casa con dirección"
🤖 IA: "✅ Entidad 'Casa' creada con 1 atributos"

👤 Tú: "Relaciona Persona con Casa"
🤖 IA: "✅ Relación creada: Persona → Casa"
```

### **Ejemplo 3: Limpieza**
```
👤 Tú: "Elimina el atributo edad de Persona"
🤖 IA: "✅ Atributo 'edad' eliminado de 'Persona'"

👤 Tú: "Borra la tabla Casa"
🤖 IA: "✅ Entidad 'Casa' eliminada (y sus relaciones)"
```

---

## 🎉 ¡Disfruta!

El **Asistente de Chat con IA** está diseñado para hacer tu trabajo más eficiente y divertido. Experimenta con diferentes comandos y descubre nuevas formas de usarlo.

**¿Tienes preguntas?** El asistente está aquí para ayudarte. ¡Solo pregunta!

---

**Powered by Gemini AI** 🚀  
**Versión:** 1.0.0  
**Última actualización:** Noviembre 2025
