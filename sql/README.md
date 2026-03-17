# MySQL SQL Scripts

Run these scripts against the database configured in `.env`:

1. `01_schema.sql` - Creates all tables and indexes required by the backend.

The backend also auto-runs `01_schema.sql` on startup after connecting to MySQL, so manual execution is optional.
