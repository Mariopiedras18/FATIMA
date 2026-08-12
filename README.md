# 🥐 Sistema Interno — Fátima Tutti Bocado

Sistema de gestión operativa para la sucursal Fátima: registro de tickets, cortes de caja, gastos, incidencias y más.

---

## 🚀 Cómo ejecutar el sistema

Desde la carpeta raíz del proyecto:

```bash
npm run dev
```

Esto levanta **backend y frontend simultáneamente**:

| Servicio    | URL                    |
|-------------|------------------------|
| Frontend    | http://localhost:5173  |
| Backend API | http://localhost:4000  |

> **Nota:** Asegúrate de tener Node.js instalado. Los `node_modules` de cada carpeta deben estar instalados (`npm install` en `/backend` y `/frontend`).

---

## 🔐 Credenciales de acceso

### Usuario Administrador
| Campo      | Valor      |
|------------|------------|
| Usuario    | `admin`    |
| Contraseña | `admin123` |
| Rol        | Admin      |

### Usuarios de prueba (seed-test)

| Nombre          | Usuario | Contraseña | Rol        |
|-----------------|---------|------------|------------|
| Ana García      | `admin` | `admin123` | Admin      |
| María López     | `maria` | `1234`     | Encargado  |
| Juan Pérez      | `juan`  | `1234`     | Operativo  |
| Laura Martínez  | `laura` | `1234`     | Encargado  |

> ⚠️ Estas credenciales son para **uso interno y desarrollo**. No compartir fuera del equipo.

---

## 📁 Estructura del proyecto

```
FATIMA/
├── backend/             # API REST (Node.js + Express)
│   ├── src/
│   │   └── server.js
│   ├── data/
│   │   └── db.json      # Base de datos JSON (lowdb)
│   ├── seed.js          # Crea usuario admin inicial
│   ├── seed-test.js     # Carga datos de prueba completos
│   └── .env             # Variables de entorno
├── frontend/            # Interfaz (React + Vite + TailwindCSS)
│   └── src/
├── package.json         # Runner principal (concurrently)
└── README.md
```

---

## ⚙️ Variables de entorno (`.env`)

```env
PORT=4000
JWT_SECRET=tutti_bocado_fatima_2026_secret_key
DB_PATH=./src/database/fatima.db
```

---

## 🛠️ Scripts disponibles

### Raíz del proyecto
| Comando             | Descripción                      |
|---------------------|----------------------------------|
| `npm run dev`       | Lanza backend + frontend juntos  |
| `npm run backend`   | Solo el backend                  |
| `npm run frontend`  | Solo el frontend                 |

### Backend (`/backend`)
| Comando               | Descripción                         |
|-----------------------|-------------------------------------|
| `npm run dev`         | Servidor con nodemon (recarga auto) |
| `npm start`           | Servidor en producción              |
| `npm run seed`        | Crear usuario admin inicial         |
| `node seed-test.js`   | Cargar datos de prueba completos    |

---

## 👥 Roles del sistema

| Rol         | Descripción                                     |
|-------------|-------------------------------------------------|
| `admin`     | Acceso total: usuarios, reportes, configuración |
| `encargado` | Cortes de caja, gastos, incidencias             |
| `operativo` | Registro de tickets y operaciones básicas       |

---

*Última actualización: Julio 2026*
