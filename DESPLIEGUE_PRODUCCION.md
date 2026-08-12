# Guía de Despliegue a Producción - Sistema Fátima Tutti Bocado

Esta guía detalla los pasos exactos para subir el sistema a producción de forma segura y permanente.

---

## 📌 1. Análisis de la Base de Datos en Producción

Actualmente, el sistema utiliza **LowDB** en desarrollo, guardando la información en `backend/src/database/data.json`.

Al pasar a producción existen dos caminos según la plataforma elegida:

### **Camino A: Despliegue en Firebase (Recomendado por Seguridad y Rapidez)**
- **Frontend**: Se sube a **Firebase Hosting** (genera tu enlace seguro HTTPS `https://fatima-tutti-bocado.web.app` gratis).
- **Base de Datos**: Se conecta a **Firebase Firestore** (Base de datos NoSQL nativa de Google).
- **Ventajas**:
  - Respaldos automáticos en la nube de Google.
  - Sincronización en tiempo real entre múltiples dispositivos (caja, tablet, celular de administradores).
  - SSL (HTTPS) gratuito incluido.
  - Cero costo de servidor para el volumen de la sucursal.

---

### **Camino B: Despliegue en Servidor Continuo (Render / Railway / VPS Propio / Servidor Local)**
- **Backend & BD**: Mantiene el backend Express con LowDB (archivo JSON persistente).
- **Ventajas**: No requiere modificar ninguna consulta de base de datos.
- **Plataformas sugeridas**:
  - **Render.com / Railway.app**: Crean la URL pública del backend en 1 clic.
  - **VPS Propio (DigitalOcean / Hetzner / AWS)**: Servidor Linux con PM2 para mantener Node.js corriendo 24/7.

---

## 🚀 2. Pasos para Subir el Frontend a Firebase Hosting

Si elegimos **Firebase Hosting** para la interfaz web:

### **Paso 1: Compilar la Aplicación Frontend**
```bash
cd frontend
npm run build
```
*(Esto genera la carpeta `frontend/dist` lista para producción)*.

### **Paso 2: Inicializar Firebase en el Proyecto**
```bash
npx firebase-tools login
npx firebase-tools init hosting
```
- Seleccionar o crear un proyecto de Firebase (ej. `fatima-tutti-bocado`).
- Especificar que el directorio público es `frontend/dist`.
- Configurar como **Single Page Application (SPA)**: `Yes` (redirecciona todas las rutas a `index.html`).

### **Paso 3: Desplegar a Producción**
```bash
npx firebase-tools deploy --only hosting
```
Al finalizar, Firebase te entregará tu enlace oficial listo:
👉 `https://tu-proyecto.web.app`

---

## 📋 3. Lista de Verificación (Checklist de Producción)

- [x] Contraseñas encriptadas con Bcrypt (100% seguro).
- [x] Autenticación mediante Tokens JWT.
- [x] Optimización de código con Vite manual chunks.
- [x] Compresión HTTP Gzip en backend.
- [x] Pruebas unitarias al 100% aprobadas.
