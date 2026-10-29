-- V6: Convert existing Google OAuth accounts with random generated passwords to explicit passwordless state
UPDATE users
SET password_hash = 'OAUTH_NO_PASSWORD'
WHERE google_id IS NOT NULL;