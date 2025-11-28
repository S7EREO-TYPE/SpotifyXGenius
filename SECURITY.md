# Security Policy

## Supported Versions

Currently supporting the latest version only.

## Reporting a Vulnerability

If you discover a security vulnerability, please email the repository owner directly.

## Known Security Considerations

### Client-Side Secrets
- **NEVER** commit real API credentials to the repository
- The `.env` file is gitignored - keep it that way
- Spotify Client Secret should NOT be in frontend code
- Use PKCE flow (already implemented) which doesn't require client secret

### Dependencies
- Development dependencies have some vulnerabilities (inherited from react-scripts)
- These don't affect production builds
- Run `npm audit` regularly to check for new issues

### CORS Configuration
- Backend server uses CORS - ensure proper origin restrictions in production
- Default allows all origins for development

### API Security
- LRCLIB API is public and doesn't require authentication
- Genius API token is server-side only
- Spotify uses OAuth2 with PKCE (secure)

## Best Practices

1. **Never commit `.env` files**
2. **Use environment variables** for all secrets
3. **Validate and sanitize** all user inputs
4. **Keep dependencies updated** regularly
5. **Use HTTPS** in production
6. **Implement rate limiting** on backend endpoints
7. **Add authentication** if deploying publicly
