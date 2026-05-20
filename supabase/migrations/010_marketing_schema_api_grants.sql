-- PostgREST (authenticator) must have USAGE on custom schemas before role switch.
-- Without this, API requests to marketing.* return 403 "permission denied for table".

GRANT USAGE ON SCHEMA marketing TO anon, authenticated, service_role, authenticator;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA marketing
  TO authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA marketing TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA marketing
  TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA marketing
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA marketing
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
