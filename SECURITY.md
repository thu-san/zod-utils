# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our packages seriously. If you discover a security vulnerability, please follow these steps:

### 1. **DO NOT** Open a Public Issue

Please do not report security vulnerabilities through public GitHub issues.

### 2. Report Privately

Instead, please report security vulnerabilities by:
- Opening a security advisory on GitHub
- Or emailing the maintainers directly (if urgent)

### 3. What to Include

Please include the following information in your report:
- Type of vulnerability
- Full paths of affected source files
- Location of the affected code (tag/branch/commit)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability and how an attacker might exploit it

### 4. Response Timeline

- We will acknowledge receipt of your vulnerability report within **48 hours**
- We will send you a more detailed response within **7 days** indicating the next steps
- We will keep you informed about the progress toward fixing the vulnerability
- We will notify you when the vulnerability is fixed

### 5. Coordinated Disclosure

We kindly ask that you:
- Give us reasonable time to fix the issue before public disclosure
- Make a good faith effort to avoid privacy violations, data destruction, and interruption or degradation of our services
- Do not exploit a security vulnerability beyond what is necessary to demonstrate it

## Security Best Practices

When using `@zod-utils/core` and `@zod-utils/react-hook-form`:

### Input Validation
- Always validate user input using Zod schemas
- Use strict validation rules for sensitive data
- Never trust client-side validation alone

### Type Safety
- Enable TypeScript strict mode
- Use proper types for all schema definitions
- Avoid using `any` types

### Dependencies
- Keep dependencies up to date: `npm update`
- Regularly run `npm audit` to check for vulnerabilities
- Review security advisories for Zod and React Hook Form

### Error Messages
- Be careful not to expose sensitive information in error messages
- Review custom error maps for potential data leakage
- Sanitize error outputs in production

### Default Values
- Be cautious when using `getSchemaDefaults()` with user-provided schemas
- Validate default values come from trusted sources
- Don't use defaults from untrusted input

## Known Security Considerations

### Schema Injection
While Zod provides runtime validation, be aware that:
- Schemas should be defined at build time, not from user input
- Dynamic schema generation should be carefully reviewed
- Recursive schemas could potentially cause stack overflow with malicious input

### Performance
- Very large or deeply nested schemas can impact performance
- Set reasonable limits on array sizes and nesting depth
- Consider rate limiting form submissions

## Security Updates

Security updates will be released as patch versions (e.g., 0.1.1) and will be clearly marked in the release notes.

Subscribe to our GitHub releases to stay informed about security updates:
- Watch this repository
- Enable notifications for security advisories

## Bug Bounty Program

We currently do not have a bug bounty program. However, we deeply appreciate security researchers who responsibly disclose vulnerabilities.

## Attribution

We will credit security researchers who report valid vulnerabilities in our release notes (unless you prefer to remain anonymous).

## Questions?

If you have questions about this security policy, please open a discussion on GitHub or contact the maintainers.

---

**Last Updated:** November 8, 2025
