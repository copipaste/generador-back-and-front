# 🎨 Figma Clone - Generador de Diagramas ER con IA

Una aplicación colaborativa en tiempo real para crear diagramas Entidad-Relación con capacidades de IA para conversión de texto, imagen y audio a diagramas.

## ✨ Características

### 🎨 Editor de Diagramas
- ✅ Canvas interactivo con zoom y pan
- ✅ Creación de entidades y atributos
- ✅ Relaciones entre entidades con cardinalidad
- ✅ Herramientas de selección, edición y eliminación
- ✅ Colores personalizables
- ✅ Undo/Redo

### 🤝 Colaboración en Tiempo Real
- ✅ Múltiples usuarios editando simultáneamente
- ✅ Cursores en vivo de otros usuarios
- ✅ Sincronización instantánea de cambios
- ✅ Powered by Liveblocks

### 🤖 Generación con IA
- 🎤 **Audio to ER**: Graba tu voz describiendo el diagrama
- 🖼️ **Image to ER**: Sube una imagen de un diagrama
- 📝 **Text to ER**: Describe el diagrama en texto

### 🚀 Generadores de Código
- ☕ **Spring Boot**: Genera proyecto completo con entidades JPA
- 🐘 **PostgreSQL**: Scripts de creación de base de datos
- 📱 **Flutter**: Modelos y servicios para aplicaciones móviles
- 📮 **Postman**: Colección de APIs para testing

### 🔐 Autenticación
- Registro e inicio de sesión con email y contraseña
- Sesiones persistentes con NextAuth.js
- Gestión de usuarios y salas

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth.js v5
- **Colaboración**: Liveblocks
- **IA**: Google Gemini
- **Despliegue**: Vercel

## 📋 Requisitos

- Node.js 18+ (recomendado: 20+)
- npm 10+
- PostgreSQL 14+

## 🚀 Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/figma-clone.git
cd figma-clone
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y edita con tus valores:

```bash
cp .env.example .env
```

Edita `.env` y configura:

```env
# Base de datos local
DATABASE_URL="postgresql://postgres:password@localhost:5432/generator_db"

# Genera un nuevo secret
AUTH_SECRET="tu-secret-generado"

# Obtén en https://liveblocks.io
LIVEBLOCKS_PUBLIC_KEY="pk_dev_xxxxx"
LIVEBLOCKS_SECRET_KEY="sk_dev_xxxxx"

# Obtén en https://aistudio.google.com/app/apikey
GEMINI_API_KEY="AIzaSyxxxxx"
```

### 4. Configurar base de datos

```bash
# Crear las tablas
npm run db:push

# (Opcional) Abrir Prisma Studio
npm run db:studio
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000) 🎉

## 🌐 Despliegue en Producción

Consulta la [Guía de Despliegue](./DEPLOYMENT.md) para instrucciones detalladas sobre cómo desplegar en Vercel.

### Verificación pre-deploy

Antes de desplegar, ejecuta:

```bash
npm run pre-deploy
```

Este script verifica:
- ✅ Archivos esenciales presentes
- ✅ TypeScript sin errores
- ✅ ESLint sin errores
- ✅ Build exitoso
- ✅ Dependencias instaladas
- ✅ No hay secrets expuestos

### Deploy rápido en Vercel

1. Push tu código a GitHub
2. Importa en [vercel.com](https://vercel.com/new)
3. Configura variables de entorno
4. Deploy automático ✨

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo con Turbo
npm run build        # Crea build de producción
npm run start        # Inicia servidor de producción
npm run preview      # Build + Start

# Base de Datos
npm run db:push      # Sincroniza schema con la base de datos
npm run db:migrate   # Ejecuta migraciones
npm run db:studio    # Abre Prisma Studio

# Calidad de Código
npm run typecheck    # Verifica tipos de TypeScript
npm run lint         # Ejecuta ESLint
npm run lint:fix     # Arregla errores de ESLint
npm run format:write # Formatea código con Prettier
npm run format:check # Verifica formato de código

# Despliegue
npm run pre-deploy   # Verifica que todo esté listo
npm run deploy:check # TypeCheck + Lint + Build
```

## 📁 Estructura del Proyecto

```
figma-clone/
├── prisma/
│   └── schema.prisma          # Schema de base de datos
├── public/                     # Archivos estáticos
├── scripts/
│   ├── pre-deploy-check.js    # Script de verificación
│   └── test-gemini.ts         # Test de Gemini API
├── src/
│   ├── app/                   # App Router de Next.js
│   │   ├── actions/           # Server Actions
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # Páginas del dashboard
│   │   ├── signin/            # Página de login
│   │   └── signup/            # Página de registro
│   ├── components/            # Componentes React
│   │   ├── ai/                # Modales de IA
│   │   ├── canvas/            # Componentes del canvas
│   │   ├── dashboard/         # Componentes del dashboard
│   │   ├── sidebars/          # Barras laterales
│   │   ├── spring-generator/  # Generadores de código
│   │   └── toolsbar/          # Barra de herramientas
│   ├── hooks/                 # React Hooks personalizados
│   ├── lib/                   # Utilidades y clientes
│   ├── server/                # Código del servidor
│   │   ├── auth/              # Configuración de NextAuth
│   │   └── db.ts              # Cliente de Prisma
│   ├── styles/                # Estilos globales
│   ├── utils/                 # Funciones utilitarias
│   ├── env.js                 # Validación de variables de entorno
│   ├── middleware.ts          # Middleware de Next.js
│   ├── schemas.ts             # Schemas de validación
│   └── types.ts               # Tipos de TypeScript
├── .env.example               # Plantilla de variables de entorno
├── DEPLOYMENT.md              # Guía de despliegue
├── DEPLOYMENT_CHECKLIST.md    # Checklist de despliegue
├── next.config.js             # Configuración de Next.js
├── package.json               # Dependencias y scripts
├── tailwind.config.ts         # Configuración de Tailwind
├── tsconfig.json              # Configuración de TypeScript
└── vercel.json                # Configuración de Vercel
```

## 🎯 Uso

### Crear un Diagrama

1. Inicia sesión o regístrate
2. En el dashboard, haz clic en "Crear nuevo diagrama"
3. Usa las herramientas del toolbar para:
   - Agregar entidades (tablas)
   - Definir atributos
   - Crear relaciones
   - Personalizar colores

### Generar desde IA

#### Audio to ER
1. Haz clic en el botón "Audio"
2. Graba tu voz describiendo el diagrama
3. O sube un archivo de audio
4. La IA generará automáticamente el diagrama

#### Image to ER
1. Haz clic en el botón "Image"
2. Sube una imagen de un diagrama
3. La IA extraerá las entidades y relaciones

#### Text to ER
1. Haz clic en el botón "Text"
2. Describe el diagrama en lenguaje natural
3. La IA interpretará y creará el diagrama

### Generar Código

1. Completa tu diagrama
2. Haz clic en los botones de generación:
   - ☕ Spring Boot
   - 🐘 PostgreSQL
   - 📱 Flutter
   - 📮 Postman
3. Se descargará un archivo .zip con el código generado

## 🤝 Colaboración

Para colaborar en un diagrama:

1. Abre un diagrama existente
2. Comparte el enlace con otros usuarios
3. Verás sus cursores y cambios en tiempo real

## 🔒 Seguridad

- ✅ Variables de entorno para todas las credenciales
- ✅ Archivo `.env` en `.gitignore`
- ✅ Headers de seguridad configurados
- ✅ HTTPS en producción (Vercel)
- ✅ Autenticación con NextAuth.js
- ✅ Validación de inputs con Zod

## 🐛 Troubleshooting

### Error: "DATABASE_URL is not valid"
- Verifica que la URL de conexión sea correcta
- Asegúrate de que PostgreSQL esté corriendo
- Usa `?sslmode=require` para conexiones remotas

### Error: "GEMINI_API_KEY is required"
- Obtén una API key en [Google AI Studio](https://aistudio.google.com/app/apikey)
- Agrégala al archivo `.env`

### Error: "Liveblocks authentication failed"
- Verifica tus keys en [Liveblocks Dashboard](https://liveblocks.io/dashboard)
- Asegúrate de usar las keys correctas (dev vs prod)

### Build errors
```bash
# Limpiar caché y reinstalar
rm -rf .next node_modules
npm install
npm run build
```

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Liveblocks](https://liveblocks.io/docs)
- [Documentación de Google Gemini](https://ai.google.dev/docs)
- [Guía de Despliegue en Vercel](./DEPLOYMENT.md)

## 📄 Licencia

Este proyecto es parte de un proyecto universitario.

## 👨‍💻 Autor

Desarrollado con ❤️ por [Tu Nombre]

---

**⚡ Quick Start:**

```bash
git clone <repo>
cd figma-clone
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run db:push
npm run dev
```

¡Visita http://localhost:3000 y comienza a crear! 🎉
