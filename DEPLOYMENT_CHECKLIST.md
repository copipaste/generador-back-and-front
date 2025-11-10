# 📝 Checklist de Despliegue - Figma Clone

Usa este checklist para asegurarte de que todo está configurado correctamente antes del despliegue.

---

## ✅ Pre-Despliegue

### 🔧 Configuración Local

- [ ] El proyecto se ejecuta correctamente en local (`npm run dev`)
- [ ] No hay errores de TypeScript (`npm run typecheck`)
- [ ] No hay errores de ESLint (`npm run lint`)
- [ ] El build se completa sin errores (`npm run build`)
- [ ] La base de datos local funciona correctamente
- [ ] Las migraciones de Prisma están actualizadas (`npm run db:push`)

### 📦 Código y Repositorio

- [ ] El código está subido a GitHub
- [ ] Archivo `.env` está en `.gitignore` (NO debe estar en git)
- [ ] Archivo `.env.example` está actualizado
- [ ] README.md tiene instrucciones claras
- [ ] No hay claves API o secrets en el código
- [ ] Todas las dependencias están en `package.json`

---

## 🔑 Variables de Entorno

### Base de Datos
- [ ] `DATABASE_URL` configurada (Neon/Supabase/Vercel Postgres)
- [ ] Connection string incluye `?sslmode=require`
- [ ] Base de datos creada y accesible

### Autenticación
- [ ] `AUTH_SECRET` generado (`openssl rand -base64 32`)
- [ ] `AUTH_SECRET` es diferente al de desarrollo
- [ ] `NODE_ENV` establecido a `production`

### Liveblocks (Colaboración)
- [ ] Cuenta en Liveblocks creada
- [ ] `LIVEBLOCKS_PUBLIC_KEY` obtenida
- [ ] `LIVEBLOCKS_SECRET_KEY` obtenida
- [ ] Proyecto de Liveblocks configurado

### Google Gemini (IA)
- [ ] Cuenta en Google AI Studio creada
- [ ] `GEMINI_API_KEY` obtenida
- [ ] API Key activa y funcionando
- [ ] Límites de uso revisados

---

## 🚀 Despliegue en Vercel

### Configuración Inicial
- [ ] Cuenta de Vercel creada
- [ ] Repositorio importado en Vercel
- [ ] Framework detectado como Next.js
- [ ] Todas las variables de entorno agregadas
- [ ] Variables aplicadas a Production, Preview y Development

### Build y Deploy
- [ ] Primer deploy completado exitosamente
- [ ] No hay errores en los logs de build
- [ ] La aplicación es accesible en la URL de Vercel
- [ ] SSL/HTTPS funcionando correctamente

### Base de Datos en Producción
- [ ] Migraciones ejecutadas (`npm run db:push`)
- [ ] Tablas creadas correctamente
- [ ] Conexión desde Vercel a DB funcionando
- [ ] Datos de prueba creados (opcional)

---

## 🧪 Pruebas Post-Despliegue

### Funcionalidad Básica
- [ ] La página principal carga correctamente
- [ ] Redirección de `/` a `/dashboard` funciona
- [ ] Estilos se muestran correctamente (Tailwind CSS)
- [ ] No hay errores en la consola del navegador

### Autenticación
- [ ] Página de login (`/signin`) accesible
- [ ] Página de registro (`/signup`) accesible
- [ ] Registro de nuevos usuarios funciona
- [ ] Login con credenciales funciona
- [ ] Sesión persiste después de recargar
- [ ] Logout funciona correctamente

### Dashboard y Rooms
- [ ] Dashboard se carga correctamente
- [ ] Crear nuevo room funciona
- [ ] Lista de rooms se muestra
- [ ] Eliminar room funciona
- [ ] Abrir room existente funciona

### Canvas y Colaboración
- [ ] Canvas se renderiza correctamente
- [ ] Herramientas del toolbar funcionan
- [ ] Crear entidades funciona
- [ ] Crear relaciones funciona
- [ ] Editar propiedades funciona
- [ ] Liveblocks (cursores múltiples) funciona
- [ ] Cambios se sincronizan en tiempo real

### Funcionalidades de IA
- [ ] Botón "Audio to ER" funciona
- [ ] Grabación de audio funciona
- [ ] Conversión de audio a diagrama funciona
- [ ] Botón "Image to ER" funciona
- [ ] Upload de imagen funciona
- [ ] Conversión de imagen a diagrama funciona
- [ ] Botón "Text to ER" funciona
- [ ] Input de texto funciona
- [ ] Conversión de texto a diagrama funciona

### Generadores de Código
- [ ] Generar Spring Boot funciona
- [ ] Generar PostgreSQL funciona
- [ ] Generar Flutter funciona
- [ ] Generar Postman Collection funciona
- [ ] Archivos se descargan correctamente (.zip)

### Performance
- [ ] Tiempo de carga < 3 segundos
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] No hay bloqueos en el UI
- [ ] Imágenes optimizadas
- [ ] Fonts cargan correctamente

---

## 🔍 Monitoreo

### Vercel Dashboard
- [ ] Analytics configurado
- [ ] Logs revisados (sin errores críticos)
- [ ] Speed Insights revisado
- [ ] Bandwidth usage monitoreado

### Base de Datos
- [ ] Conexiones monitoreadas (Neon/Supabase dashboard)
- [ ] Storage usage revisado
- [ ] Query performance aceptable

### Servicios Externos
- [ ] Liveblocks usage revisado
- [ ] Gemini API quota revisado
- [ ] No hay límites excedidos

---

## 🔐 Seguridad

- [ ] Todas las API keys son privadas (no expuestas al cliente)
- [ ] HTTPS activo en toda la aplicación
- [ ] Headers de seguridad configurados
- [ ] CORS configurado correctamente
- [ ] Rate limiting considerado (si aplica)
- [ ] Inputs sanitizados y validados
- [ ] SQL injection prevenido (Prisma lo maneja)
- [ ] XSS prevenido (React lo maneja)

---

## 📱 Responsive y Compatibilidad

- [ ] Desktop (1920x1080) ✅
- [ ] Laptop (1366x768) ✅
- [ ] Tablet (768x1024) ✅
- [ ] Mobile (375x667) ✅
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅

---

## 🎯 Optimizaciones Opcionales

- [ ] Dominio personalizado configurado
- [ ] SEO meta tags añadidos
- [ ] Open Graph tags para redes sociales
- [ ] Favicon agregado
- [ ] PWA configurado (opcional)
- [ ] Google Analytics agregado (opcional)
- [ ] Error tracking (Sentry) configurado (opcional)
- [ ] CDN para assets estáticos (Vercel lo incluye)

---

## 📊 KPIs y Métricas

### Día 1 Post-Deploy
- [ ] 0 errores críticos en logs
- [ ] Uptime: 100%
- [ ] Respuesta del servidor < 200ms

### Primera Semana
- [ ] Revisar analytics diariamente
- [ ] Monitorear costos de servicios
- [ ] Recolectar feedback de usuarios
- [ ] Documentar issues encontrados

### Primer Mes
- [ ] Uptime > 99.9%
- [ ] Tiempo de respuesta estable
- [ ] Sin exceder límites de servicios gratuitos
- [ ] Plan de escalabilidad definido

---

## 🆘 Plan de Rollback

Si algo sale mal después del deploy:

1. **En Vercel Dashboard:**
   - Ve a **Deployments**
   - Encuentra el deployment anterior estable
   - Click en **⋯** → **Promote to Production**

2. **Variables de Entorno:**
   - Backup de todas las variables guardado ✅
   - Ubicación: `[GUARDAR_AQUI]`

3. **Base de Datos:**
   - Backup antes de migraciones ✅
   - Comando de restore: `[DOCUMENTAR_AQUI]`

---

## ✅ Despliegue Completado

Firma y fecha cuando todo esté listo:

- **Desplegado por:** _________________
- **Fecha:** _________________
- **URL de Producción:** _________________
- **Versión:** _________________

---

## 📞 Contactos de Emergencia

- **Soporte Vercel:** https://vercel.com/support
- **Soporte Neon:** https://neon.tech/docs/introduction
- **Soporte Liveblocks:** https://liveblocks.io/support
- **Google AI Studio:** https://aistudio.google.com

---

**Última actualización:** Noviembre 2025

> 💡 **Tip:** Imprime este checklist y márcalo físicamente durante el despliegue para no olvidar ningún paso.
