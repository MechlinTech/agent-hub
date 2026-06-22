-- BlazeMeter API credentials stored in org settings (configured via Integrations UI)
ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS blazemeter_api_key_id text;
ALTER TABLE org_settings ADD COLUMN IF NOT EXISTS blazemeter_api_key_secret text;
