# API Routes

Ce dossier contient toutes les routes API de l'application.

## Structure

- `auth/`: Routes d'authentification
- `mobile/`: Routes spécifiques à l'application mobile (voir [README](./mobile/README.md))

## apiHandler

Toutes les routes API utilisent `apiHandler` depuis `@/lib/server/api-handler` pour:

- Validation des méthodes HTTP (`allowedMethods`)
- Vérification de l'authentification Firebase (`requireAuth`)
- Vérification Firebase App Check (`requireAppCheck`)
- Vérification des permissions/roles (`requiredRoles`)
- Rate limiting
- Gestion des headers CORS
- Formatage uniforme des réponses

### Exemple d'utilisation

```typescript
import { apiHandler, ApiContext } from '@/lib/server/api-handler';

export const GET = (request: NextRequest, context: ApiContext) =>
  apiHandler(
    request,
    context,
    async (req, ctx) => {
      // Traitement de la requête
      return Response.json({ success: true, data: {/* ... */} });
    },
    {
      requireAuth: true,
      requireAppCheck: true,
      allowedMethods: ['GET'],
      rateLimit: { windowMs: 60000, max: 30 },
    }
  );
```

## Format des réponses

Toutes les réponses API suivent ce format:

### Succès
```json
{
  "success": true,
  "data": { /* Données */ },
  "pagination": { /* Pagination (si applicable) */ }
}
```

### Erreur
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Message d'erreur",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```
