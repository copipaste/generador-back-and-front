# 🚀 Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu aplicación Figma Clone (Generador de Diagramas ER con IA) en Vercel paso a paso.

---

## 📋 Pre-requisitos

Antes de comenzar, necesitas:

- ✅ Cuenta en [Vercel](https://vercel.com) (gratis)
- ✅ Cuenta en [GitHub](https://github.com) (tu código debe estar en un repositorio)
- ✅ Cuenta en [Neon](https://neon.tech) o [Supabase](https://supabase.com) (base de datos PostgreSQL gratis)
- ✅ Cuenta en [Liveblocks](https://liveblocks.io) (colaboración en tiempo real)
- ✅ API Key de [Google Gemini](https://aistudio.google.com/app/apikey) (IA)

---

## 🗄️ Paso 1: Configurar Base de Datos (PostgreSQL)

### Opción A: Neon.tech (Recomendado - Serverless PostgreSQL)

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Crea un nuevo proyecto:
   - **Project name**: `figma-clone-db`
   - **Region**: Elige la más cercana a tu audiencia
3. Copia el **Connection String**:
   ```
   postgresql://usuario:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
   ```
4. Guárdalo para el Paso 3

### Opción B: Vercel Postgres

1. En tu proyecto de Vercel, ve a la pestaña **Storage**
2. Click en **Create Database** → **Postgres**
3. Copia el `DATABASE_URL` que se genera automáticamente

### Opción C: Supabase

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Crea un nuevo proyecto
3. Ve a **Settings** → **Database** → **Connection String**
4. Usa el modo **Connection pooling** para mejor rendimiento

---

## 🤝 Paso 2: Configurar Liveblocks

1. Ve a [liveblocks.io/dashboard](https://liveblocks.io/dashboard)
2. Crea un nuevo proyecto:
   - **Project name**: `figma-clone`
3. Ve a **API Keys**
4. Copia:
   - **Public Key**: `pk_dev_xxxxx...`
   - **Secret Key**: `sk_dev_xxxxx...`
5. Guárdalos para el Paso 3

---

## 🤖 Paso 3: Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click en **Create API Key**
3. Copia la key: `AIzaSyxxxxxxxxxx...`
4. Guárdala para el Paso 3

---

## 🔐 Paso 4: Generar AUTH_SECRET

Ejecuta en tu terminal:

```bash
# Opción 1: Con OpenSSL
openssl rand -base64 32

# Opción 2: Con npx
npx auth secret
```

Copia el resultado, lo necesitarás en el siguiente paso.

---

## 🚢 Paso 5: Desplegar en Vercel

### A. Subir código a GitHub

```bash
# Si aún no has subido tu código
git init
git add .
git commit -m "Initial commit - Ready for deployment"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### B. Importar proyecto en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Selecciona tu repositorio de GitHub
3. Click en **Import**

### C. Configurar Variables de Entorno

En la sección **Environment Variables**, agrega las siguientes:

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `AUTH_SECRET` | El generado en Paso 4 | `5z2HiSIHCL6XtZ...` |
| `DATABASE_URL` | Connection string de Neon/Supabase | `postgresql://user:pass@...` |
| `LIVEBLOCKS_PUBLIC_KEY` | Public key de Liveblocks | `pk_dev_xxxxx...` |
| `LIVEBLOCKS_SECRET_KEY` | Secret key de Liveblocks | `sk_dev_xxxxx...` |
| `GEMINI_API_KEY` | API Key de Google Gemini | `AIzaSyxxxxxxx...` |

**⚠️ IMPORTANTE**: Aplica las variables a los 3 ambientes:
- ✅ Production
- ✅ Preview
- ✅ Development

### D. Deploy

1. Click en **Deploy**
2. Espera 2-3 minutos
3. ¡Tu app estará lista en `https://tu-proyecto.vercel.app`!

---

## 🔧 Paso 6: Ejecutar Migraciones de Base de Datos

Después del primer deploy, necesitas crear las tablas en la base de datos:

### Opción A: Desde tu máquina local

1. Crea un archivo `.env.production.local`:

```bash
DATABASE_URL="postgresql://tu-connection-string-de-neon"
```

2. Ejecuta las migraciones:

```bash
npm run db:push
```

### Opción B: Usando Vercel CLI (Recomendado)

1. Instala Vercel CLI:

```bash
npm i -g vercel
```

2. Login en Vercel:

```bash
vercel login
```

3. Link tu proyecto:

```bash
vercel link
```

4. Ejecuta las migraciones:

```bash
vercel env pull .env.production.local
npm run db:push
```

---

## ✅ Paso 7: Verificar el Despliegue

1. Visita tu URL de Vercel: `https://tu-proyecto.vercel.app`
2. Deberías ver la página de inicio que redirige a `/dashboard`
3. Prueba el login/registro
4. Crea un nuevo diagrama
5. Prueba las funcionalidades de IA:
   - 🎤 Audio to ER
   - 🖼️ Image to ER
   - 📝 Text to ER

---

## 🔄 Actualizaciones Automáticas

Cada vez que hagas push a GitHub:

```bash
git add .
git commit -m "Actualización X"
git push
```

Vercel automáticamente:
- ✅ Detectará el cambio
- ✅ Ejecutará el build
- ✅ Desplegará la nueva versión
- ✅ Creará un preview para PRs

---

## 🎯 Dominios Personalizados

1. En Vercel, ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado:
   - `www.tudominio.com`
   - `tudominio.com`
3. Configura los DNS según las instrucciones de Vercel
4. ¡Listo! SSL automático incluido

---

## 📊 Monitoreo y Analytics

Vercel incluye:

- 📈 **Analytics**: Visitas, performance, Core Web Vitals
- 🔍 **Logs**: Revisa logs en tiempo real
- ⚡ **Speed Insights**: Métricas de rendimiento
- 🐛 **Error Tracking**: Captura de errores

Accede desde el dashboard de tu proyecto.

---

## 🛠️ Troubleshooting

### Error: "DATABASE_URL is not defined"

- Verifica que agregaste la variable en Vercel
- Asegúrate de aplicarla a "Production"
- Redeploy el proyecto

### Error: "Prisma Client not generated"

En `package.json`, verifica que tengas:

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Error: "Authentication failed"

- Regenera el `AUTH_SECRET`
- Actualiza la variable en Vercel
- Redeploy

### Error en funciones de IA

- Verifica tu `GEMINI_API_KEY` en [Google AI Studio](https://aistudio.google.com/app/apikey)
- Revisa que no hayas excedido el límite de requests gratuitas

### Problemas de conexión a base de datos

- Asegúrate de usar `?sslmode=require` al final de tu `DATABASE_URL`
- Verifica que tu base de datos permita conexiones externas
- Revisa las IPs permitidas en Neon/Supabase (Vercel usa IPs dinámicas, deja abierto)

---

## 💰 Costos Estimados

| Servicio | Plan Gratuito | Límites |
|----------|---------------|---------|
| **Vercel** | ✅ Hobby | 100 GB bandwidth, proyectos ilimitados |
| **Neon** | ✅ Free Tier | 0.5 GB storage, 3 proyectos |
| **Liveblocks** | ✅ Free | 100 usuarios concurrentes |
| **Gemini AI** | ✅ Free Tier | 15 requests/min, 1500 requests/day |

**Total: $0/mes** para proyectos pequeños-medianos 🎉

---

## 🔐 Seguridad

### Checklist de Seguridad:

- ✅ Nunca subas el archivo `.env` a GitHub
- ✅ Cambia el `AUTH_SECRET` en producción
- ✅ Usa variables de entorno para todas las keys
- ✅ Habilita 2FA en tu cuenta de Vercel
- ✅ Revisa los logs regularmente
- ✅ Mantén las dependencias actualizadas: `npm audit fix`

---

## 📚 Recursos Adicionales

- 📖 [Documentación de Vercel](https://vercel.com/docs)
- 📖 [Documentación de Next.js](https://nextjs.org/docs)
- 📖 [Documentación de Prisma](https://www.prisma.io/docs)
- 📖 [Documentación de NextAuth.js](https://next-auth.js.org)
- 📖 [Documentación de Liveblocks](https://liveblocks.io/docs)

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en Vercel Dashboard
2. Consulta la sección de Troubleshooting arriba
3. Revisa [Vercel Status](https://www.vercel-status.com)
4. Busca en [GitHub Discussions de Vercel](https://github.com/vercel/vercel/discussions)

---

## 🎉 ¡Felicidades!

Tu aplicación está ahora en producción y lista para usar. Comparte tu URL con el mundo:

```
https://tu-proyecto.vercel.app
```

---

**Última actualización**: Noviembre 2025
