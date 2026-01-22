# BookDB Backend - System Flow

```mermaid
flowchart TD
    Client[Client Request]

    Client --> Router[URL Router]

    Router -->|HTML Pages| Views[Template Views]
    Router -->|REST API| API[ViewSets]
    Router -->|/admin| Admin[Django Admin]

    Views --> DB[(Database)]
    API --> Auth{Authenticated?}
    Admin --> DB

    Auth -->|Yes| Serializer[Serializers]
    Auth -->|No| Error[401 Error]

    Serializer --> DB

    DB --> Response[Response]
    Error --> Response

    Response --> Client
```

## Basic Flow

1. **Client** sends request
2. **Router** directs to HTML views, REST API, or Admin
3. **Authentication** checks if user can perform write operations
4. **Serializers** validate and format API data
5. **Database** stores Authors and Books
6. **Response** sent back to client
