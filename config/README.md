Configuration folder — external service clients only

This folder contains *configuration* modules for external services. These files should:

- **Only configure** clients or factories (e.g., S3 client, Redis client, Elasticsearch client, Bull options, Socket.IO factory).
- **Not** include business logic (no domain-specific calls, no data transformations, etc.).
- Be small and testable. Business logic should live in `services/` or `modules/`.

Available modules:
- `awsS3.js` — AWS S3 client factory
- `clerk.js` — Clerk HTTP client (thin wrapper)
- `cloudinary.js` — Cloudinary config and client
- `database.js` — Mongoose connection helpers
- `elasticsearch.js` — Elasticsearch client factory
- `redis.js` — Redis client factory
- `bull.js` — Bull queue factory
- `socket.js` — socket.io server factory

If you need a helper that performs business actions (e.g. `getUserById`), put it in `services/` and import the relevant client from this folder.
