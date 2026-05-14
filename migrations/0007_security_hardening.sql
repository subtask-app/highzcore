-- =============================================================================
-- Migration 0007 — Security hardening
-- =============================================================================
-- Apply AFTER 0006.
--
-- Belt-and-suspenders constraints on user-supplied URLs so a malicious
-- channel_url can't slip a `javascript:` or `data:` payload into the admin
-- chat (where it could trigger XSS if any view drops `href={channel_url}`
-- without sanitization). Client validates these too, but the DB has the last
-- word.
-- =============================================================================

-- contracts.channel_url must be an http(s) URL.
ALTER TABLE contracts
  DROP CONSTRAINT IF EXISTS chk_channel_url_protocol;
ALTER TABLE contracts
  ADD CONSTRAINT chk_channel_url_protocol
  CHECK (channel_url ~* '^https?://[^\s]+$');

-- channel_image — when set — must also be an http(s) URL.
ALTER TABLE contracts
  DROP CONSTRAINT IF EXISTS chk_channel_image_protocol;
ALTER TABLE contracts
  ADD CONSTRAINT chk_channel_image_protocol
  CHECK (channel_image IS NULL OR channel_image ~* '^https?://[^\s]+$');

-- payment_proof_url — same rule.
ALTER TABLE contracts
  DROP CONSTRAINT IF EXISTS chk_payment_proof_protocol;
ALTER TABLE contracts
  ADD CONSTRAINT chk_payment_proof_protocol
  CHECK (payment_proof_url IS NULL OR payment_proof_url ~* '^https?://[^\s]+$');

-- messages.media_url — same.
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS chk_message_media_protocol;
ALTER TABLE messages
  ADD CONSTRAINT chk_message_media_protocol
  CHECK (media_url IS NULL OR media_url ~* '^https?://[^\s]+$');

DO $$ BEGIN
  RAISE NOTICE 'migration 0007_security_hardening applied. URL CHECKs enforced.';
END $$;
