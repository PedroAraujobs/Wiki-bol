# Supabase database setup

Run `supabase-schema.sql` in the Supabase SQL Editor before starting the Spring Boot application.

Then run `supabase-verify.sql` to confirm that the `users`, `pages`, and `page_history` tables, constraints, and indexes exist in the `public` schema.

After the tables exist, configure these environment variables:

```text
SUPABASE_DATABASE_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require
SUPABASE_DATABASE_USERNAME=<database-user>
SUPABASE_DATABASE_PASSWORD=<database-password>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
```

Keep `spring.jpa.hibernate.ddl-auto=validate` so the application checks the schema without changing the remote database automatically.
