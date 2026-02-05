# Backend

This folder contains the KPT Website backend service.

## Environment variables

- Use `.env` in local development to store real secrets (database URLs, API keys, tokens).
- **Never commit** your `.env` file to the repository.
- Copy `.env.example` to `.env` and fill in the real values before running the app.

Example:

```bash
cp .env.example .env
# then edit .env and set real secrets
```

You can run the provided check to ensure no `.env` is committed:

```bash
npm run check-no-env
```
