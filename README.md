# Chat Service - Microservicio de Chat con IA

Un microservicio completo para chat en tiempo real con integración de IA (Gemini) y funcionalidades administrativas.

## 🚀 Características

### Chat en Tiempo Real
- **WebSockets** para comunicación en tiempo real
- **Respuestas automáticas** con Google Gemini IA
- **Notificaciones** de "está escribiendo"
- **Historial persistente** de mensajes
- **Sistema de intentos** de chat

### Chat Privado 1 a 1
- **Conversaciones privadas** entre usuarios
- **Gestión de conversaciones** con paginación
- **Marcado de mensajes** como leídos
- **Historial de conversaciones** completo

### Funcionalidades Administrativas
- **Obtener todas las conversaciones** de todos los usuarios
- **Obtener todos los mensajes** de chat de todos los usuarios
- **Obtener todos los intentos** de chat de todos los usuarios
- **Paginación avanzada** para grandes volúmenes de datos
- **Estadísticas generales** del sistema

## 📋 Requisitos

- Node.js 18+
- MongoDB
- API Key de Google Gemini

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd chat-service
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/chat-service
GEMINI_API_KEY=tu-api-key-de-gemini
PORT=3003
NODE_ENV=development
```

4. **Ejecutar el servicio**
```bash
npm start
```

## 📡 Endpoints Disponibles

### Health Check
- `GET /s3/health` - Estado del servicio

### Chat API
- `POST /s3/chat/message` - Enviar mensaje de chat
- `GET /s3/chat/history/:estudiante_id` - Historial de chat
- `GET /s3/chat/history/:estudiante_id/messages` - Solo mensajes
- `POST /s3/chat/attempt` - Registrar intento de chat
- `GET /s3/chat/attempts/:estudiante_id` - Intentos de chat
- `GET /s3/chat/status` - Estado del servicio de chat
- `GET /s3/chat/ai/info` - Información de IA
- `POST /s3/chat/ai/test` - Probar IA

### Conversaciones API
- `POST /s3/conversations/message` - Enviar mensaje privado
- `GET /s3/conversations/:usuario_id` - Conversaciones de usuario
- `GET /s3/conversations/:conversation_id/messages` - Mensajes de conversación
- `GET /s3/conversations/status` - Estado del servicio de conversaciones

### Admin API (Nuevas Rutas)
- `GET /s3/admin/conversations` - Todas las conversaciones de todos los usuarios
- `GET /s3/admin/messages` - Todos los mensajes de chat de todos los usuarios
- `GET /s3/admin/attempts` - Todos los intentos de chat de todos los usuarios
- `GET /s3/admin/status` - Estado del servicio administrativo

### WebSocket
- `ws://localhost:3003` - Conexión WebSocket
- `GET /s3/ws-info` - Información de WebSocket

### Documentación
- `GET /s3/api-docs` - Documentación Swagger UI
- `GET /s3/api-docs.json` - Especificación OpenAPI
- `GET /s3/swagger.json` - Archivo Swagger

## 🔧 Funcionalidades Administrativas

### Obtener Todas las Conversaciones
```bash
GET /s3/admin/conversations?page=1&limit=50
```

**Respuesta:**
```json
{
  "data": {
    "conversations": [
      {
        "id": "conv123",
        "participant1_id": "user1",
        "participant2_id": "user2",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T12:00:00.000Z",
        "is_active": true,
        "last_message_at": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Todas las conversaciones obtenidas exitosamente",
  "status": "success"
}
```

### Obtener Todos los Mensajes
```bash
GET /s3/admin/messages?page=1&limit=50
```

**Respuesta:**
```json
{
  "data": {
    "messages": [
      {
        "id": "msg123",
        "mensaje": "Hola, ¿cómo estás?",
        "estado": "enviado",
        "fecha": "2024-01-01T12:00:00.000Z",
        "usuario_id": "user1",
        "is_ai_response": false,
        "conversation_id": "conv123"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 500,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Todos los mensajes obtenidos exitosamente",
  "status": "success"
}
```

### Obtener Todos los Intentos
```bash
GET /s3/admin/attempts?page=1&limit=50
```

**Respuesta:**
```json
{
  "data": {
    "attempts": [
      {
        "id": "attempt123",
        "open_without_send": 3,
        "chat_estudiante_id": "estudiante1",
        "created_at": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 200,
      "totalPages": 4,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Todos los intentos obtenidos exitosamente",
  "status": "success"
}
```

## 🗄️ Estructura de la Base de Datos

### Colecciones MongoDB

#### ChatHistory
```javascript
{
  _id: String,
  mensaje: String,
  estado: String, // 'enviado', 'entregado', 'leido'
  fecha: Date,
  usuario_id: String,
  created_at: Date,
  updated_at: Date,
  is_ai_response: Boolean,
  response_to_message_id: String,
  conversation_id: String,
  recipient_id: String
}
```

#### Conversation
```javascript
{
  _id: String,
  participant1_id: String,
  participant2_id: String,
  created_at: Date,
  updated_at: Date,
  is_active: Boolean,
  last_message_at: Date
}
```

#### ChatAttempts
```javascript
{
  _id: String,
  open_without_send: Number,
  chat_estudiante_id: String,
  created_at: Date
}
```

## 🔌 WebSocket Events

### Cliente → Servidor
- `send_message` - Enviar mensaje
- `typing` - Usuario está escribiendo
- `stop_typing` - Usuario dejó de escribir
- `join_chat` - Unirse al chat
- `leave_chat` - Salir del chat
- `ping` - Ping para mantener conexión

### Servidor → Cliente
- `message_sent` - Mensaje enviado exitosamente
- `ai_response` - Respuesta de IA
- `user_typing` - Otro usuario está escribiendo
- `user_connected` - Usuario conectado
- `user_disconnected` - Usuario desconectado
- `error` - Error en el servidor
- `pong` - Respuesta al ping

## 🤖 Integración con Gemini IA

El servicio utiliza Google Gemini para generar respuestas automáticas:

- **Modelo**: gemini-pro
- **Especialización**: Educación y tutoría
- **Idioma**: Español
- **Contexto**: Mantiene contexto de conversación
- **Manejo de errores**: Respuestas graciosas en caso de error

## 📊 Monitoreo y Logs

El servicio incluye logs detallados para monitoreo:

```bash
# Ver logs en tiempo real
npm run dev

# Logs de ejemplo:
📋 GET /admin/conversations - Obteniendo todas las conversaciones
✅ Conversaciones obtenidas: 25
💬 GET /admin/messages - Obteniendo todos los mensajes
✅ Mensajes obtenidos: 150
📊 GET /admin/attempts - Obteniendo todos los intentos
✅ Intentos obtenidos: 75
```

## 🚀 Despliegue

### Docker
```bash
# Construir imagen
docker build -t chat-service .

# Ejecutar contenedor
docker run -p 3003:3003 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/chat-service \
  -e GEMINI_API_KEY=tu-api-key \
  chat-service
```

### Variables de Entorno de Producción
```env
NODE_ENV=production
PORT=3003
MONGODB_URI=mongodb://localhost:27017/chat-service
GEMINI_API_KEY=tu-api-key-de-produccion
ALLOWED_ORIGINS=https://tu-dominio.com
```

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar en producción
npm run dev        # Iniciar en desarrollo con nodemon
npm run build      # Compilar TypeScript
npm run test       # Ejecutar tests
npm run lint       # Linter
npm run generate-swagger  # Generar documentación Swagger
```

## 🔒 Seguridad

- **Helmet** para headers de seguridad
- **Rate limiting** configurado
- **CORS** configurado apropiadamente
- **Validación** de entrada con Joi
- **Sanitización** de datos

## 📈 Escalabilidad

- **Paginación** en todas las consultas
- **Índices** optimizados en MongoDB
- **WebSockets** con manejo de conexiones
- **Arquitectura** modular y extensible

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
