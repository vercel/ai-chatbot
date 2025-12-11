# Security Best Practices

## Environment Variables

**NEVER commit credentials to code!** All sensitive values must be stored in environment variables.

### Required Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual credentials:**
   - Replace all placeholder values
   - Use strong, unique secrets
   - Never commit `.env` to version control

3. **Verify `.env` is in `.gitignore`:**
   ```bash
   # Should be ignored
   .env
   .env.local
   .env.*.local
   ```

### Required Environment Variables

These must be set in your `.env` file (no defaults in code):

- `POSTGRES_URL` - Database connection string
- `JWT_SECRET_KEY` - Secret for JWT token signing

### Optional Environment Variables

These have defaults or are optional:

- `POSTGRES_URL_SYNC` - Sync database URL (optional)
- `XAI_API_KEY` - AI provider key (optional)
- `BLOB_READ_WRITE_TOKEN` - Blob storage token (optional)
- `ENVIRONMENT` - Defaults to "development"
- `CORS_ORIGINS` - Defaults to localhost

## Generating Secure Secrets

### JWT Secret Key

```bash
# Generate a secure random key
openssl rand -hex 32
```

### Database Password

- Use strong, randomly generated passwords
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Store securely (password manager)

## Production Checklist

- [ ] All secrets are in environment variables (not hardcoded)
- [ ] `.env` file is in `.gitignore`
- [ ] Strong JWT secret key generated
- [ ] Database credentials are secure
- [ ] CORS origins are restricted to your domain
- [ ] `ENVIRONMENT=production` is set
- [ ] HTTPS is enabled
- [ ] Database connections use SSL/TLS
- [ ] Secrets are rotated regularly

## Common Mistakes to Avoid

❌ **Don't:**
- Hardcode credentials in `config.py`
- Commit `.env` files
- Use weak/default passwords
- Share credentials in chat/email
- Store secrets in code comments

✅ **Do:**
- Use environment variables
- Keep `.env` in `.gitignore`
- Use strong, unique secrets
- Rotate secrets regularly
- Use secret management services in production (AWS Secrets Manager, etc.)

## Local Development

For local development, it's acceptable to use:
- Simple passwords (but still not commit them)
- Local database without SSL
- Development secrets

But still:
- Never commit `.env`
- Use different credentials for production
- Don't share your local `.env` file
