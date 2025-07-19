# Chat Service - Microservicio de Chat

Un microservicio completo para manejo de chat en tiempo real con soporte para IA y conversaciones privadas 1 a 1.

## 🚀 Características

### Chat con IA
- **Chat en tiempo real** con WebSockets
- **Respuestas automáticas** usando Gemini AI
- **Historial persistente** de mensajes
- **Sistema de intentos** de chat
- **Notificaciones** de "está escribiendo"

### Chat Privado 1 a 1
- **Mensajes privados** entre usuarios
- **Gestión de conversaciones** automática
- **Historial de conversaciones** con paginación
- **Marcado de mensajes leídos**
- **Búsqueda de conversaciones** por usuario

## 📋 Requisitos

- Node.js 18+
- MongoDB
- API Key de Google Gemini AI

## 🛠️ Instalación

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
PORT=3003
MONGODB_URI=mongodb://localhost:27017/chat-service
GEMINI_API_KEY=tu_api_key_de_gemini
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
TRUST_PROXY=false
```

4. **Ejecutar el servicio**
```bash
npm run dev
```

## 📡 Endpoints

### Health Check
```
GET /s3/health
```

### Chat con IA
```
POST /s3/chat/message
GET /s3/chat/history/:estudiante_id
GET /s3/chat/history/:estudiante_id/messages
POST /s3/chat/attempt
GET /s3/chat/attempts/:estudiante_id
GET /s3/chat/status
GET /s3/chat/ai/info
POST /s3/chat/ai/test
```

### Conversaciones 1 a 1
```
POST /s3/conversations/message
GET /s3/conversations/:usuario_id
GET /s3/conversations/:conversation_id/messages
GET /s3/conversations/status
```

### WebSocket
```
WebSocket: ws://localhost:3003
GET /s3/ws-info
```

### Documentación API
```
GET /s3/api-docs          # Interfaz Swagger UI
GET /s3/api-docs.json     # Especificación OpenAPI en JSON
GET /s3/swagger.json      # Archivo Swagger JSON completo
```

## 💬 API de Chat con IA

### Enviar mensaje
```http
POST /s3/chat/message
Content-Type: application/json

{
  "mensaje": "Hola, ¿cómo estás?",
  "usuario_id": "user123",
  "chat_estudiante_id": "estudiante456"
}
```

**Respuesta:**
```json
{
  "data": {
    "message": {
      "id": "msg123",
      "mensaje": "Hola, ¿cómo estás?",
      "estado": "enviado",
      "fecha": "2024-01-15T10:30:00Z",
      "usuario_id": "user123",
      "is_ai_response": false
    },
    "ai_response": {
      "id": "ai456",
      "mensaje": "¡Hola! Estoy muy bien, gracias por preguntar. ¿En qué puedo ayudarte hoy?",
      "estado": "enviado",
      "fecha": "2024-01-15T10:30:05Z",
      "usuario_id": "ai-system",
      "is_ai_response": true,
      "response_to_message_id": "msg123"
    }
  },
  "message": "Mensaje enviado exitosamente y respuesta de IA generada",
  "status": "success"
}
```

### Obtener historial
```http
GET /s3/chat/history/user123?page=1&limit=20
```

## 💬 API de Conversaciones 1 a 1

### Enviar mensaje privado
```http
POST /s3/conversations/message
Content-Type: application/json

{
  "mensaje": "Hola, ¿cómo va todo?",
  "usuario_id": "user123",
  "recipient_id": "user456"
}
```

**Respuesta:**
```json
{
  "data": {
    "message": {
      "id": "msg789",
      "mensaje": "Hola, ¿cómo va todo?",
      "estado": "enviado",
      "fecha": "2024-01-15T10:30:00Z",
      "usuario_id": "user123",
      "conversation_id": "conv123",
      "recipient_id": "user456",
      "is_ai_response": false
    }
  },
  "message": "Mensaje privado enviado exitosamente",
  "status": "success"
}
```

### Obtener conversaciones de un usuario
```http
GET /s3/conversations/user123?page=1&limit=20
```

**Respuesta:**
```json
{
  "data": {
    "conversations": [
      {
        "id": "conv123",
        "participant1_id": "user123",
        "participant2_id": "user456",
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "is_active": true,
        "last_message_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "message": "Conversaciones obtenidas exitosamente",
  "status": "success"
}
```

### Obtener mensajes de una conversación
```http
GET /s3/conversations/conv123/messages?usuario_id=user123&page=1&limit=50
```

**Respuesta:**
```json
{
  "data": {
    "conversation": {
      "id": "conv123",
      "participant1_id": "user123",
      "participant2_id": "user456",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_active": true,
      "last_message_at": "2024-01-15T10:30:00Z"
    },
    "messages": [
      {
        "id": "msg789",
        "mensaje": "Hola, ¿cómo va todo?",
        "estado": "leido",
        "fecha": "2024-01-15T10:30:00Z",
        "usuario_id": "user123",
        "conversation_id": "conv123",
        "recipient_id": "user456",
        "is_ai_response": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "message": "Mensajes de conversación obtenidos exitosamente",
  "status": "success"
}
```

## 🔐 Autenticación

La API utiliza autenticación simplificada basada en `userId`. Para usar la API:

1. **Proporcionar userId** en las peticiones
2. **Para WebSockets**: Incluir userId en `auth.userId` al conectar

### Ejemplo de conexión WebSocket:
```javascript
const socket = io('http://localhost:3003', {
  auth: {
    userId: 'user123',
    userType: 'student', // opcional
    email: 'user@example.com' // opcional
  }
});
```

## 🔌 WebSocket Events

### Cliente → Servidor
- `send_message`: Enviar mensaje
- `typing`: Usuario está escribiendo
- `stop_typing`: Usuario dejó de escribir
- `join_chat`: Unirse al chat
- `leave_chat`: Salir del chat
- `ping`: Ping para mantener conexión

### Servidor → Cliente
- `message_sent`: Mensaje enviado exitosamente
- `ai_response`: Respuesta de IA
- `user_typing`: Usuario está escribiendo
- `user_connected`: Usuario conectado
- `user_disconnected`: Usuario desconectado
- `error`: Error en el servidor
- `pong`: Respuesta al ping

## 🏗️ Arquitectura

```
src/
├── application/
│   ├── services/
│   │   └── GeminiAI.service.ts
│   └── use-cases/
│       ├── SendMessage.usecase.ts
│       ├── SendPrivateMessage.usecase.ts
│       ├── GetChatHistory.usecase.ts
│       ├── GetConversations.usecase.ts
│       └── GetConversationMessages.usecase.ts
├── domain/
│   ├── entities/
│   │   ├── ChatHistory.entity.ts
│   │   └── Conversation.entity.ts
│   └── repositories/
│       ├── ChatRepository.interface.ts
│       └── ConversationRepository.interface.ts
├── infrastructure/
│   ├── controllers/
│   │   ├── Chat.controller.ts
│   │   └── Conversation.controller.ts
│   ├── database/
│   │   ├── connection.ts
│   │   └── models/
│   │       ├── ChatHistory.model.ts
│   │       └── Conversation.model.ts
│   ├── repositories/
│   │   ├── MongoChatRepository.ts
│   │   └── MongoConversationRepository.ts
│   ├── routes/
│   │   ├── chat.routes.ts
│   │   └── conversation.routes.ts
│   ├── server/
│   │   └── ChatServer.ts
│   └── websocket/
│       └── ChatSocket.handler.ts
└── shared/
    └── types/
        └── response.types.ts
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage
```

## 🐳 Docker

```bash
# Construir imagen
docker build -t chat-service .

# Ejecutar contenedor
docker run -p 3003:3003 --env-file .env chat-service
```

## 📊 Monitoreo

El servicio incluye endpoints de monitoreo:

- `/s3/health`: Estado general del servicio
- `/s3/chat/status`: Estado del chat y IA
- `/s3/conversations/status`: Estado de conversaciones
- `/s3/ws-info`: Información de WebSocket

## 📚 Documentación API

### Generar Documentación Swagger
```bash
# Generar archivo swagger.json
npm run swagger:generate

# El archivo se genera en la raíz del proyecto
# swagger.json
```

### Swagger UI
Accede a la documentación interactiva de la API en:
```
http://localhost:3003/s3/api-docs
```

### Características de la documentación:
- **Interfaz interactiva**: Prueba los endpoints directamente desde el navegador
- **Ejemplos de uso**: Cada endpoint incluye ejemplos de request/response
- **Validación automática**: Valida los datos de entrada según los esquemas
- **Códigos de respuesta**: Documentación completa de todos los códigos HTTP
- **Esquemas de datos**: Definiciones detalladas de todos los objetos de datos

### Especificación OpenAPI
La especificación completa está disponible en formato JSON:
```
http://localhost:3003/s3/api-docs.json
```

### Archivo Swagger JSON
Documentación completa en formato JSON estático:
```
http://localhost:3003/s3/swagger.json
```

### Archivos de Documentación
- `swagger.json`: Documentación completa generada estáticamente
- `scripts/generate-swagger.js`: Script para regenerar la documentación
- `src/infrastructure/swagger/swagger.config.ts`: Configuración de Swagger

### Endpoints documentados:
- **Health**: Estado y monitoreo del servicio
- **Chat**: Chat con IA, historial, intentos
- **Conversations**: Mensajes privados 1 a 1
- **WebSocket**: Información de conexiones en tiempo real

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3003` |
| `MONGODB_URI` | URI de MongoDB | `mongodb://localhost:27017/chat-service` |
| `GEMINI_API_KEY` | API Key de Gemini AI | - |
| `NODE_ENV` | Ambiente | `development` |
| `ALLOWED_ORIGINS` | Orígenes permitidos para CORS | `*` |
| `TRUST_PROXY` | Confiar en headers de proxy (solo en producción) | `false` |

### Límites y Configuraciones

- **Mensajes**: Máximo 5000 caracteres
- **Conversaciones por página**: Máximo 50
- **Mensajes por página**: Máximo 100
- **Rate limiting**: 200 requests por IP cada 15 minutos
- **WebSocket**: Conexiones ilimitadas

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:

- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación de la API

---

**Desarrollado con ❤️ para facilitar la comunicación en tiempo real** # chat-service
