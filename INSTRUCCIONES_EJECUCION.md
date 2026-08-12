# Guía de Ejecución Rápida: Sistema Fátima - Tutti Bocado

Sigue estos pasos en la terminal para arrancar el sistema completo.

---

## 🔑 Credenciales de Acceso (Usuarios de la Semilla)

| Rol | Usuario | Contraseña | Nombre Completo |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `admin123` | Ana García |
| **Encargado** | `maria` | `1234` | María López |
| **Encargado** | `laura` | `1234` | Laura Martínez |
| **Operativo** | `juan` | `1234` | Juan Pérez |

---

## 🚀 Paso 1: Ir a la carpeta raíz del proyecto
Copia y pega en tu PowerShell:
```powershell
cd C:\Users\mario\OneDrive\Documentos\PROGRAMAS\FATIMA
```

---

## ⚡ Paso 2: Arrancar todo el sistema (Backend + Frontend)
Ejecuta el siguiente comando:
```powershell
npm run dev
```

---

## 🧪 Comandos Útiles Adicionales

### Ejecutar Pruebas Unitarias
```powershell
node --test backend/tests/system.test.js
```

### Reiniciar la Base de Datos con Datos de Prueba (Semilla)
```powershell
node backend/seed.js
```

---

## 📊 Puertos del Sistema
- **Aplicación Web (Frontend)**: [http://localhost:5180](http://localhost:5180)
- **Servidor de API (Backend)**: [http://localhost:4000](http://localhost:4000)
- **Documentación de API (Swagger/OpenAPI)**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
