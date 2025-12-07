# Aeternum - Sistema de Gestión Bibliotecaria

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

Sistema integral de gestión bibliotecaria que permite a los usuarios buscar, solicitar préstamos físicos y digitales, descargar libros, gestionar listas de deseos y calificar contenido. Incluye panel administrativo completo para bibliotecarios con gestión de usuarios, libros y préstamos.

## Tabla de Contenidos

- [Demo en Vivo](#demo-en-vivo)
- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Base de Datos](#base-de-datos)
- [Ejecución Local](#ejecución-local)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Solución de Problemas](#solución-de-problemas)
- [Despliegue](#despliegue)
- [Documentación](#documentación)

---

## Demo en Vivo

**Aplicación desplegada**: [https://aeternum-app-production.up.railway.app/](https://aeternum-app-production.up.railway.app/)

**Documentación completa**: [Manual de Usuario](https://santixxtt.github.io/Documentation-Aeternum/)

---

## Características

### Para Usuarios

- Autenticación segura con JWT
- Registro y gestión de perfil
- Búsqueda avanzada de libros
- Solicitud de préstamos físicos y digitales
- Descarga de libros digitales disponibles
- Lista de deseos personalizada
- Sistema de calificación (1-5 estrellas)
- Comentarios y reseñas
- Historial de préstamos con estados:
  - Pendientes
  - Activos
  - Atrasados
  - Cancelados
  - Devueltos
- Notificaciones por correo electrónico
- Edición y eliminación de cuenta

### Para Bibliotecarios

- Panel administrativo completo
- Gestión de estado de préstamos físicos
- CRUD de usuarios (excepto ID y contraseña)
- CRUD completo de libros
- Exportación de datos:
  - Usuarios en PDF/Excel
  - Libros en PDF/Excel
- Sistema de alertas automáticas
- Gestión de disponibilidad de libros
- Confirmaciones por correo

---

## Stack Tecnológico

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 4
- **Enrutamiento**: React Router
- **HTTP Client**: Axios
- **Estilos**: CSS Modules / Styled Components
- **Iconos**: React Icons / Lucide React

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Servidor ASGI**: Uvicorn
- **ORM**: SQLAlchemy / MySQL Connector
- **Validación**: Pydantic
- **Autenticación**: JWT (JSON Web Tokens)
- **Caché**: Redis
- **Email**: SMTP / SendGrid
- **Exportación**: ReportLab (PDF), openpyxl (Excel)

### Base de Datos
- **Base de Datos Principal**: MySQL
- **Caché**: Redis

### Infraestructura
- **Hosting**: Railway
  - Frontend
  - Backend API
  - Base de Datos MySQL
  - Redis Cache
- **Control de Versiones**: Git/GitHub

---

## Arquitectura
```
┌─────────────────┐
│   Usuario       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  (React + Vite) │
│  Railway        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  (FastAPI)      │
│  Railway        │
└────┬────┬───────┘
     │    │
     │    └──────────┐
     │               │
     ▼               ▼
┌─────────┐    ┌─────────┐
│  MySQL  │    │  Redis  │
│ Railway │    │ Railway │
└─────────┘    └─────────┘
```

### Capas de la Aplicación

**Capa de Presentación (Frontend)**:
- Componentes React modulares
- Gestión de estado con Context API / Redux
- Rutas protegidas con autenticación

**Capa de Negocio (Backend)**:
- Rutas (`routers/`): Endpoints de la API
- Servicios (`services/`): Lógica de negocio
- Modelos (`models/`): Estructura de datos
- Esquemas (`schemas/`): Validación con Pydantic

**Capa de Datos**:
- MySQL: Datos persistentes
- Redis: Sesiones y caché

---

## Requisitos Previos

### Python 3.10 o superior

Verifica la instalación:
```bash
python --version
```

Descarga desde: [https://www.python.org/downloads/](https://www.python.org/downloads/)

**Importante**: Durante la instalación, marca la opción "Add Python to PATH"

### Node.js 16 o superior

Verifica la instalación:
```bash
node --version
```

Descarga desde: [https://nodejs.org/es/download](https://nodejs.org/es/download)

### Git

Verifica la instalación:
```bash
git --version
```

Descarga desde: [https://git-scm.com/downloads](https://git-scm.com/downloads)

### Editor de Código (Recomendado)

Visual Studio Code: [https://code.visualstudio.com/download](https://code.visualstudio.com/download)

**Extensiones recomendadas**:
- Python (Microsoft)
- ESLint
- Prettier
- MySQL
- GitLens

---

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/Santixxtt/aeternum-app.git
cd aeternum-app
```

### 2. Instalar dependencias del Frontend

Desde la raíz del proyecto:
```bash
npm install
```

Esto instalará todas las dependencias listadas en `package.json` y creará la carpeta `node_modules`.

### 3. Instalar dependencias del Backend
```bash
cd backend
pip install -r requirements.txt
```

**Recomendación: Usar entorno virtual**
```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

---

## Configuración

### Variables de Entorno

El proyecto utiliza variables de entorno para gestionar credenciales sensibles de forma segura.

#### Crear archivo .env

En la carpeta `backend/`, crea un archivo `.env`:
```bash
cd backend
touch .env  # Linux/Mac
# O créalo manualmente en Windows
```

#### Plantilla de variables (.env)
```env
# Base de Datos MySQL
DB_HOST=tu-mysql-host.railway.app
DB_PORT=3306
DB_NAME=aeternum_db
DB_USER=root
DB_PASSWORD=tu_password_seguro

# URL de conexión completa (alternativa)
DATABASE_URL=mysql://user:password@host:3306/database

# Redis Cache
REDIS_HOST=tu-redis-host.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=tu_redis_password
REDIS_DB=0

# Seguridad y Autenticación
SECRET_KEY=tu_clave_secreta_jwt_muy_segura_y_larga
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuración de Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_password_app
EMAIL_FROM=noreply@aeternum.com

# Configuración de la Aplicación
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,https://aeternum-app-production.up.railway.app

# Configuración de Archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB en bytes
ALLOWED_EXTENSIONS=pdf,epub,mobi

# Frontend URL (para redirecciones)
FRONTEND_URL=http://localhost:5173
```

**Notas de Seguridad**:
- Nunca compartas tu archivo `.env`
- Asegúrate de que `.env` esté en `.gitignore`
- Usa contraseñas fuertes y únicas
- Para Gmail, usa "Contraseñas de aplicación" en lugar de tu contraseña normal

#### Archivo .env.example

Para facilitar la configuración, crea un archivo `.env.example` con la estructura pero sin valores sensibles:
```bash
cd backend
cp .env .env.example
# Edita .env.example y elimina los valores sensibles
```

---

## Base de Datos

### Configuración en Railway

El proyecto utiliza MySQL hospedado en Railway.

#### Opción 1: Crear tu propia base de datos

1. Crea una cuenta en [Railway](https://railway.app)
2. Crea un nuevo proyecto
3. Añade un servicio MySQL:
   - Click en "New" → "Database" → "MySQL"
4. Añade un servicio Redis:
   - Click en "New" → "Database" → "Redis"
5. Copia las credenciales y configúralas en tu `.env`

#### Opción 2: Solicitar acceso

Contacta con el equipo de desarrollo para obtener acceso a la base de datos compartida.

### Estructura de la Base de Datos

El sistema utiliza las siguientes tablas principales:

- **users**: Información de usuarios y bibliotecarios
- **books**: Catálogo de libros
- **loans**: Préstamos físicos y digitales
- **wishlist**: Lista de deseos de usuarios
- **reviews**: Comentarios y calificaciones
- **notifications**: Sistema de notificaciones

### Verificar Conexión

Al iniciar el backend, verás logs confirmando la conexión:
```
INFO:     Connected to MySQL database successfully
INFO:     Redis connection established
INFO:     Application startup complete
```

---

## Ejecución Local

### Iniciar el Frontend

Desde la raíz del proyecto:
```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

### Iniciar el Backend

En una terminal separada:
```bash
cd backend
uvicorn app.main:app --reload
```

El backend estará disponible en: **http://localhost:8000**

**Documentación API interactiva**:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Workflow Recomendado

1. Abre dos terminales en tu editor
2. Terminal 1: Inicia el backend
3. Terminal 2: Inicia el frontend
4. Accede a `http://localhost:5173` en tu navegador

---

## Estructura del Proyecto
```
aeternum-app/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # Punto de entrada FastAPI
│   │   ├── database.py              # Configuración MySQL
│   │   ├── redis.py                 # Configuración Redis
│   │   ├── security.py              # JWT y encriptación
│   │   │
│   │   ├── models/                  # Modelos SQLAlchemy
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── book.py
│   │   │   ├── loan.py
│   │   │   └── review.py
│   │   │
│   │   ├── routers/                 # Endpoints API
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── books.py
│   │   │   ├── loans.py
│   │   │   ├── wishlist.py
│   │   │   └── admin.py
│   │   │
│   │   ├── schemas/                 # Esquemas Pydantic
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── book.py
│   │   │   └── loan.py
│   │   │
│   │   ├── services/                # Lógica de negocio
│   │   │   ├── __init__.py
│   │   │   ├── email_service.py
│   │   │   ├── export_service.py
│   │   │   └── notification_service.py
│   │   │
│   │   └── utils/                   # Utilidades
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       └── validators.py
│   │
│   ├── uploads/                     # Archivos subidos
│   ├── .env                         # Variables de entorno
│   ├── .env.example                 # Plantilla de .env
│   ├── requirements.txt             # Dependencias Python
│   └── Procfile                     # Config Railway
│
├── src/                             # Frontend React
│   ├── assets/                      # Imágenes, iconos
│   │
│   ├── components/                  # Componentes React
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Loader.jsx
│   │   ├── books/
│   │   │   ├── BookCard.jsx
│   │   │   ├── BookList.jsx
│   │   │   └── BookDetails.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   └── admin/
│   │       ├── UserManager.jsx
│   │       └── BookManager.jsx
│   │
│   ├── pages/                       # Páginas principales
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── BookCatalog.jsx
│   │   ├── BookDetail.jsx
│   │   ├── Wishlist.jsx
│   │   ├── Loans.jsx
│   │   ├── Profile.jsx
│   │   └── Admin/
│   │       ├── Dashboard.jsx
│   │       ├── Users.jsx
│   │       └── Books.jsx
│   │
│   ├── services/                    # Servicios API
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── bookService.js
│   │   ├── loanService.js
│   │   └── userService.js
│   │
│   ├── context/                     # Context API
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── utils/                       # Utilidades
│   │   ├── constants.js
│   │   └── helpers.js
│   │
│   ├── App.jsx                      # Componente principal
│   ├── App.css
│   ├── main.jsx                     # Punto de entrada
│   └── index.css
│
├── public/                          # Archivos estáticos
├── .gitignore
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## Funcionalidades

### Módulo de Autenticación

**Endpoints**:
- `POST /api/auth/register` - Registro de nuevos usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cierre de sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/forgot-password` - Recuperación de contraseña

**Características**:
- Autenticación con JWT
- Hash seguro de contraseñas (bcrypt)
- Tokens de acceso con expiración
- Validación de email
- Sistema de roles (Usuario/Bibliotecario)

---

### Módulo de Libros

**Endpoints**:
- `GET /api/books` - Listar todos los libros
- `GET /api/books/{id}` - Detalle de un libro
- `GET /api/books/search` - Búsqueda avanzada
- `POST /api/books` - Crear libro (admin)
- `PUT /api/books/{id}` - Actualizar libro (admin)
- `DELETE /api/books/{id}` - Eliminar libro (admin)
- `GET /api/books/{id}/download` - Descargar libro digital

**Características**:
- Catálogo completo de libros
- Búsqueda por título, autor, género, ISBN
- Filtros avanzados
- Información detallada (portada, sinopsis, etc.)
- Disponibilidad en tiempo real
- Descarga de libros digitales
- Sistema de calificaciones

---

### Módulo de Préstamos

**Endpoints**:
- `GET /api/loans` - Listar préstamos del usuario
- `GET /api/loans/{id}` - Detalle de préstamo
- `POST /api/loans` - Solicitar préstamo
- `PUT /api/loans/{id}/cancel` - Cancelar préstamo
- `PUT /api/loans/{id}/return` - Devolver préstamo (admin)
- `GET /api/loans/history` - Historial completo

**Estados de préstamo**:
- **Pendiente**: Solicitud en espera
- **Activo**: Préstamo en curso
- **Atrasado**: Fecha de devolución vencida
- **Cancelado**: Préstamo cancelado por usuario o admin
- **Devuelto**: Libro devuelto correctamente

**Características**:
- Préstamos físicos y digitales
- Gestión de fechas de devolución
- Alertas de vencimiento automáticas
- Historial detallado
- Renovación de préstamos
- Multas por retraso

---

### Módulo de Lista de Deseos

**Endpoints**:
- `GET /api/wishlist` - Obtener lista de deseos
- `POST /api/wishlist` - Agregar libro a lista
- `DELETE /api/wishlist/{book_id}` - Eliminar de lista

**Características**:
- Gestión personal de libros favoritos
- Notificaciones de disponibilidad
- Vista rápida desde catálogo

---

### Módulo de Reseñas y Calificaciones

**Endpoints**:
- `GET /api/reviews/{book_id}` - Reseñas de un libro
- `POST /api/reviews` - Crear reseña
- `PUT /api/reviews/{id}` - Editar reseña
- `DELETE /api/reviews/{id}` - Eliminar reseña
- `POST /api/reviews/{id}/rating` - Calificar libro (1-5 estrellas)

**Características**:
- Sistema de estrellas (1-5)
- Comentarios detallados
- Edición y eliminación de propias reseñas
- Promedio de calificaciones
- Moderación por administradores

---

### Panel de Administración

**Gestión de Usuarios**:
- Ver listado completo
- Crear nuevos usuarios
- Editar información (excepto ID y contraseña)
- Suspender/activar cuentas
- Exportar datos en PDF/Excel

**Gestión de Libros**:
- CRUD completo
- Actualizar disponibilidad
- Gestión de stock físico y digital
- Exportar catálogo en PDF/Excel

**Gestión de Préstamos**:
- Ver todos los préstamos
- Cambiar estados
- Marcar devoluciones
- Aplicar multas
- Enviar recordatorios

**Reportes**:
- Préstamos por período
- Libros más solicitados
- Usuarios más activos
- Estadísticas generales

---

### Sistema de Notificaciones

**Notificaciones por Email**:
- Confirmación de registro
- Aprobación de préstamo
- Recordatorio de devolución
- Alerta de retraso
- Disponibilidad de libro en wishlist
- Cancelación de préstamo

**Alertas en la Aplicación**:
- Notificaciones en tiempo real
- Historial de notificaciones
- Gestión de preferencias

---

## Solución de Problemas

### Error: "uvicorn: command not found"

**Causa**: Uvicorn no está instalado o Python no está en el PATH.

**Soluciones**:

1. **Verifica Python en PATH**:
```bash
   python --version
   pip --version
```

2. **Reinstala uvicorn**:
```bash
   pip install uvicorn
```

3. **Usa Python directamente**:
```bash
   python -m uvicorn app.main:app --reload
```

4. **Activa el entorno virtual**:
```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
```

---

### Error de conexión a MySQL

**Síntomas**: "Can't connect to MySQL server" o "Access denied"

**Soluciones**:

1. Verifica las credenciales en `.env`
2. Confirma que Railway esté activo
3. Revisa los logs del backend:
```bash
   uvicorn app.main:app --reload --log-level debug
```
4. Prueba la conexión con MySQL Workbench o similar
5. Verifica que el puerto no esté bloqueado por firewall

---

### Redis no se conecta

**Síntomas**: "Connection refused" o "Authentication failed"

**Soluciones**:

1. Verifica credenciales de Redis en `.env`
2. Confirma que el servicio Redis en Railway esté activo
3. Revisa la configuración en `redis.py`
4. Para desarrollo, puedes comentar temporalmente funciones que usen Redis

---

### Error al enviar emails

**Síntomas**: Emails no se envían o error SMTP

**Soluciones**:

1. **Para Gmail**, usa "Contraseñas de aplicación":
   - Ve a tu cuenta Google → Seguridad
   - Activa verificación en 2 pasos
   - Genera una contraseña de aplicación
   - Úsala en `SMTP_PASSWORD`

2. Verifica configuración SMTP:
```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
```

3. Revisa logs del backend para detalles del error

---

### Puerto ya en uso

**Síntomas**: "Address already in use" o "Port is already allocated"

**Soluciones**:

**Backend (cambiar puerto)**:
```bash
uvicorn app.main:app --reload --port 8001
```

**Frontend (Vite asigna automáticamente)**:
```bash
npm run dev
# Si el puerto 5173 está ocupado, usará 5174, 5175, etc.
```

**Liberar puerto**:

Windows:
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
lsof -ti:8000 | xargs kill -9
```

---

### Errores al instalar dependencias

**Frontend**:
```bash
# Limpiar cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Backend**:
```bash
# Actualizar pip
python -m pip install --upgrade pip

# Reinstalar dependencias
pip install -r requirements.txt --no-cache-dir
```

---

### Archivos no se suben

**Síntomas**: Error al subir portadas o documentos

**Soluciones**:

1. Verifica permisos de la carpeta `uploads/`:
```bash
   mkdir -p uploads
   chmod 755 uploads  # Linux/Mac
```

2. Verifica límite de tamaño en `.env`:
```env
   MAX_FILE_SIZE=10485760  # 10MB
```

3. Confirma extensiones permitidas:
```env
   ALLOWED_EXTENSIONS=pdf,epub,mobi,jpg,png
```

---

### CORS errors en desarrollo

**Síntomas**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solución**:

En `main.py`, verifica que incluya tu URL local:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://aeternum-app-production.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Despliegue

### Despliegue en Railway

Todo el stack está desplegado en Railway: Frontend, Backend, MySQL y Redis.

#### Configuración del Proyecto

1. **Crea una cuenta en Railway**: [https://railway.app](https://railway.app)

2. **Crea un nuevo proyecto**

3. **Añade los servicios necesarios**:
   - MySQL Database
   - Redis Database
   - Backend (FastAPI)
   - Frontend (React + Vite)

#### Configurar Backend

1. Conecta tu repositorio de GitHub
2. Configura el directorio: `backend`
3. Añade variables de entorno en Railway (todas las del `.env`)
4. Command de inicio:
```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Configurar Frontend

1. Conecta tu repositorio de GitHub
2. Railway detectará automáticamente Vite
3. Configura variable de entorno:
```
   VITE_API_URL=https://tu-backend.railway.app
```

#### Configurar MySQL

1. Railway creará automáticamente la base de datos
2. Copia las credenciales y agrégalas al backend

#### Configurar Redis

1. Railway creará automáticamente Redis
2. Copia las credenciales y agrégalas al backend

### Archivos de Configuración

**Procfile** (opcional, Railway lo detecta automáticamente):
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**railway.json** (backend):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Variables de Entorno en Railway

Asegúrate de configurar todas estas variables en Railway:
```
DB_HOST=<valor de MySQL service>
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=<valor de MySQL service>
REDIS_HOST=<valor de Redis service>
REDIS_PORT=6379
REDIS_PASSWORD=<valor de Redis service>
SECRET_KEY=<generar clave segura>
SMTP_USER=<tu email>
SMTP_PASSWORD=<contraseña de app>
FRONTEND_URL=<url de tu frontend en Railway>
```

---

## Documentación

### Documentación de Usuario

Manual completo para usuarios finales:
[https://santixxtt.github.io/Documentation-Aeternum/](https://santixxtt.github.io/Documentation-Aeternum/)

Incluye:
- Guías de uso
- Capturas de pantalla
- Preguntas frecuentes
- Tutoriales paso a paso

### Documentación de API

Una vez desplegado, accede a la documentación interactiva:

**Desarrollo**:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

**Producción**:
- Swagger UI: [https://aeternum-app-production.up.railway.app/docs](https://aeternum-app-production.up.railway.app/docs)
- ReDoc: [https://aeternum-app-production.up.railway.app/redoc](https://aeternum-app-production.up.railway.app/redoc)

---

## Contribuciones

Las contribuciones son bienvenidas. Por favor sigue el proceso:

1. Fork el proyecto
2. Crea una rama para tu feature:
```bash
   git checkout -b feature/nueva-funcionalidad
```
3. Commit tus cambios:
```bash
   git commit -m 'Agregar nueva funcionalidad'
```
4. Push a la rama:
```bash
   git push origin feature/nueva-funcionalidad
```
5. Abre un Pull Request

### Guía de Estilo

**Python (Backend)**:
- Sigue PEP 8
- Usa type hints
- Documenta funciones complejas
- Nombres descriptivos en inglés

**JavaScript/React (Frontend)**:
- Usa ESLint
- Componentes funcionales con hooks
- Nombres de componentes en PascalCase
- Nombres de funciones en camelCase

### Commits

Formato recomendado:
tipo(alcance): descripción
Tipos:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato, punto y coma, etc.
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Tareas de mantenimiento

---

## Seguridad

### Buenas Prácticas

- Nunca commitees el archivo `.env`
- Usa contraseñas fuertes y únicas
- Mantén actualizadas las dependencias
- Valida todas las entradas de usuario
- Usa HTTPS en producción
- Implementa rate limiting
- Hash de contraseñas con bcrypt
- Tokens JWT con expiración

### Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:
1. NO abras un issue público
2. Contacta al equipo de desarrollo directamente
3. Proporciona detalles del problema
4. Espera confirmación antes de divulgar

---

## Recomendaciones

### Desarrollo

- Usa entornos virtuales para Python
- Sigue el orden de instalación
- No ejecutes múltiples instancias en los mismos puertos
- Revisa los logs frecuentemente
- Usa Git para control de versiones
- Documenta cambios significativos

### Producción

- Configura respaldos automáticos de la base de datos
- Monitorea logs de errores
- Implementa rate limiting
- Usa HTTPS
- Configura variables de entorno correctamente
- Mantén actualizadas las dependencias de seguridad

---

## Licencia

Este proyecto está bajo la licencia [Especificar: MIT, Apache 2.0, etc.]

---

## Equipo de Desarrollo

**Desarrolladores**: [Nombres del equipo]

**Repositorio**: [https://github.com/Santixxtt/aeternum-app](https://github.com/Santixxtt/aeternum-app)

**Documentación**: [https://santixxtt.github.io/Documentation-Aeternum/](https://santixxtt.github.io/Documentation-Aeternum/)

**Demo**: [https://aeternum-app-production.up.railway.app/](https://aeternum-app-production.up.railway.app/)

---

## Soporte

Para reportar bugs, solicitar features o hacer preguntas:

- **Issues en GitHub**: [https://github.com/Santixxtt/aeternum-app/issues](https://github.com/Santixxtt/aeternum-app/issues)
- **Documentación**: [https://santixxtt.github.io/Documentation-Aeternum/](https://santixxtt.github.io/Documentation-Aeternum/)
- **Email**: [Especificar email de contacto]

---

## Versión

**Versión actual**: 1.0.0

**Última actualización**: Diciembre 2025

---

## Agradecimientos

- Equipo de desarrollo de Aeternum
- Comunidad de FastAPI y React
- Railway por el hosting integral
- Bibliotecas y frameworks open source utilizados
