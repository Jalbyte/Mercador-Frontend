## Manual de usuario — Mercador

Este documento describe cómo preparar, ejecutar y usar los componentes del proyecto Mercador (Backend, Frontend e Infra). Está pensado para desarrolladores que quieren levantar el proyecto localmente o con Docker.

### 1. Visión general
- Backend: `Mercador-Backend/` (TypeScript, Node). Punto de entrada: `src/index.ts`.
- Frontend: `Mercador-Frontend/` (Next.js + TypeScript). App en `src/app/`.
- Infra: `mercador-infra/` (docker-compose, Prometheus template).

El backend expone una API REST que consume el frontend. La infraestructura incluye plantillas para monitorización y servicios auxiliares.

### 2. Requisitos del sistema
- Node.js (LTS recomendado, por ejemplo 18.x o 20.x).
- npm (v8+).
- Docker y Docker Compose (si vas a usar contenedores).
- Windows PowerShell (los comandos incluidos están en PowerShell).

### 3. Variables de entorno (configuración)
1. Copia `Mercador-Backend/.env.example` a `Mercador-Backend/.env` y completa los valores.
2. Revisa `src/config/env.ts` y los archivos en `src/config/` (`supabase.ts`, `redis.ts`) para entender las variables obligatorias.
3. Ajusta CORS/ORIGIN para permitir el origen del frontend si trabajas localmente.

Variables típicas a configurar:
- `PORT` — puerto del backend.
- `SUPABASE_URL`, `SUPABASE_KEY` — si usas Supabase.
- `REDIS_URL` — para cache/sesiones.

### 4. Instalación y ejecución (desarrollo)

Backend (desde `Mercador-Backend`):
```powershell
cd Mercador-Backend
npm install
npm run dev

# para producción local
npm run build; npm start
```

Frontend (desde `Mercador-Frontend`):
```powershell
cd Mercador-Frontend
npm install
npm run dev

# para producción local
npm run build; npm run start
```

Notas:
- Levanta el backend antes que el frontend para que la API esté disponible.
- Sustituye puertos y orígenes según tus variables en `.env`.

### 5. Ejecutar con Docker (opciones)

Levantar el backend con Docker Compose (desde `Mercador-Backend`):
```powershell
cd Mercador-Backend
docker compose up --build
```

Levantar la infraestructura (Prometheus, Redis, etc.) (desde `mercador-infra`):
```powershell
cd mercador-infra
docker compose up -d
```

Antes de ejecutar, revisa los `docker-compose.yml` y los `.env` referenciados para asegurar que los servicios se enlazan por los host/nombres correctos.

### 6. Estructura principal y propósito
- `src/index.ts` — arranque de la app, configuración global de middlewares.
- `src/config/` — configuración (env, redis, metrics, supabase).
- `src/middlewares/` — auth, CSRF, logging, rate-limit, error handler, metrics.
- `src/routes/` — definición de endpoints (`auth.ts`, `products.ts`, `cart.ts`, `orders.ts`, `health.ts`).
- `src/services/` — lógica de negocio (productos, carrito, pedidos, usuarios, redis).
- `src/utils/` — utilidades (errores, validación, logger).

### 7. Endpoints esperados (resumen)
Revisa `Mercador-Backend/src/routes/` para las rutas exactas. Ejemplos típicos:
- `GET /health` — healthcheck.
- `POST /auth/login` — iniciar sesión.
- `POST /auth/logout` — cerrar sesión.
- `GET /products` — listar productos.
- `GET /products/:id` — detalle de producto.
- `POST /cart` — añadir al carrito.
- `GET /cart` — ver carrito.
- `POST /orders` — crear pedido.

Para documentación exacta de payloads y respuestas, abre los archivos en `src/routes/` y `src/services/`.

### 8. Ejemplos rápidos de uso (PowerShell)

Healthcheck:
```powershell
curl http://localhost:PORT/health
```

Listar productos:
```powershell
curl http://localhost:PORT/products
```

Login (ejemplo JSON):
```powershell
curl -Method POST -ContentType 'application/json' -Body '{"email":"user@example.com","password":"secret"}' http://localhost:PORT/auth/login
```

Recuerda reemplazar `PORT` por el puerto configurado en tu `.env` (por ejemplo 3000).

### 9. Autenticación y headers
- El proyecto tiene middlewares `auth.ts`, `authMiddleware.ts`, `supabaseAuth.ts` y `cookieToAuthHeader.ts` que marcan cómo se gestionan sesiones/headers.
- Usa `Authorization: Bearer <token>` o cookies según la configuración del backend.

### 10. Logs y métricas
- Métricas: integraciones en `src/config/metrics.ts` y `src/middlewares/metrics.ts` para Prometheus.
- Si usas `mercador-infra`, adapta `prometheus.yml.template`.
- Logs estructurados vía `src/utils/logger.ts`.

### 11. Troubleshooting (problemas comunes)
- npm run dev falla por variables: Copia `.env.example` → `.env` y completa valores.
- CORS: añade el origen del frontend a la configuración CORS del backend.
- Redis/Supabase inaccesibles en Docker: revisa nombres de servicio en `docker-compose` y las variables de `.env`.

### 12. Buenas prácticas y próximos pasos sugeridos
- Añadir documentación exacta de la API con OpenAPI/Swagger.
- Añadir tests (Jest + supertest) para rutas críticas.
- Añadir CI (lint, build, test) en GitHub Actions.
- Documentar detalle de variables en `Mercador-Backend/.env.example` y ampliar `README.md` por carpeta.

---
Este `manual.md` está pensado como guía rápida. ¿Quieres que extraiga automáticamente las rutas y payloads directamente desde `Mercador-Backend/src/routes/` y añada ejemplos exactos a este manual? Si sí, lo hago y actualizo el documento con la lista de endpoints reales.
