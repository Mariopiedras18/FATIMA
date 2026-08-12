# Credenciales de Acceso a Producción - Sistema Fátima Tutti Bocado

- **URL del Sistema**: [https://pasteleria-d5a50.web.app](https://pasteleria-d5a50.web.app)
- **Sucursal**: Fátima Tutti Bocado

---

## 👥 Tabla de Usuarios y Roles Habilitados

Únicamente existen **2 Roles** en el sistema:
1. 🔴 **`admin` (Administrador)**: Acceso Total (Dashboard, Reportes Financieros, Gestión de Usuarios y Operaciones).
2. 🟡 **`encargado` (Encargado de Sucursal)**: Acceso Operativo (Registro Diario de Tickets, Cortes de Caja, Gastos y Pendientes de Limpieza).

---

### 🔑 Credencial Inicial Única Habilitada:

| Nombre Personal | Nombre de Usuario | Contraseña | Rol / Nivel de Acceso | Acceso Permitido |
| :--- | :--- | :--- | :--- | :--- |
| **Ana García** | `admin` | `admin123` | **Administrador (`admin`)** | 🟢 Acceso Total (Dashboard, Reportes, Gestión de Usuarios) |

*Nota: Para mayor seguridad, solo se ha mantenido la cuenta Administrador inicial (`admin`). Puede crear los usuarios adicionales (encargados, cajeros, etc.) directamente desde el menú **Configuración**.*

---

## 🔒 Matriz de Seguridad y Privilegios por Rol

| Módulo del Sistema | Rol `encargado` | Rol `admin` |
| :--- | :---: | :---: |
| 📊 **Inicio (Dashboard General)** | ❌ Restringido | ✅ Acceso Total |
| 📄 **Reportes Financieros** | ❌ Restringido | ✅ Acceso Total |
| ⚙️ **Gestión de Credenciales** | ❌ Restringido | ✅ Acceso Total |
| 🎟️ **Registro Diario de Tickets** | ✅ Acceso Total | ✅ Acceso Total |
| 💰 **Cortes de Caja (Primarios y Secundarios)** | ✅ Acceso Total | ✅ Acceso Total |
| 📉 **Registro de Gastos** | ✅ Acceso Total | ✅ Acceso Total |
| 🧹 **Pendientes & Roll de Limpieza** | ✅ Acceso Total | ✅ Acceso Total |
| 🚨 **Incidencias y Mejoras** | ✅ Acceso Total | ✅ Acceso Total |
| 🧰 **Mobiliario y Equipo** | ✅ Acceso Total | ✅ Acceso Total |

---

## 💡 Recomendaciones de Seguridad
1. El Administrador puede modificar o crear nuevas credenciales en cualquier momento desde el menú **Configuración** (`https://pasteleria-d5a50.web.app/configuracion`).
2. Si un **Encargado** intenta ingresar a las rutas de Administrador por la barra de direcciones del navegador, el sistema lo **redireccionará automáticamente a Registro Diario (`/tickets`)**.
