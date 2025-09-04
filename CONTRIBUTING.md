# Contributing to Privacy Utils

Thank you for your interest in contributing to Privacy Utils! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18+ (we recommend using the latest LTS version)
- pnpm 8+
- Git

### Installation

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/privacy-utils.git
cd privacy-utils
```

2. Install dependencies:
```bash
pnpm install
```

3. Build all packages:
```bash
pnpm run build
```

4. Run tests:
```bash
pnpm run test
```

## Development Workflow

### 1. Choose an Issue

- Check the [Issues](https://github.com/YOUR_USERNAME/privacy-utils/issues) page
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes

- Follow the existing code style
- Write clear, concise commit messages
- Add tests for new functionality
- Update documentation as needed

### 4. Testing

Run the test suite:

```bash
# Run all tests
pnpm run test

# Run tests for a specific package
pnpm --filter privacy-utils-core-crypto run test

# Run tests in watch mode
pnpm run test -- --watch
```

### 5. Code Quality

Ensure your code meets our standards:

```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Build all packages
pnpm run build
```

### 6. Commit Changes

Use conventional commit format:

```bash
# For features
git commit -m "feat: add new privacy mechanism"

# For bug fixes
git commit -m "fix: resolve memory leak in DP calculation"

# For documentation
git commit -m "docs: update API documentation"

# For refactoring
git commit -m "refactor: optimize noise generation algorithm"
```

### 7. Create Pull Request

1. Push your branch to GitHub:
```bash
git push origin feature/your-feature-name
```

2. Create a Pull Request on GitHub
3. Fill out the PR template with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots/videos if applicable
   - Test results

## Project Structure

```
privacy-utils/
├── packages/
│   ├── core-crypto/     # Cryptographic primitives
│   ├── dp/             # Differential Privacy
│   ├── secure-agg/     # Secure Aggregation
│   ├── anon-auth/      # Anonymous Authentication
│   └── utils/          # Utilities
├── tooling/
│   ├── eslint-config/  # ESLint configuration
│   └── tsconfig/       # TypeScript configurations
├── apps/
│   ├── examples/       # Usage examples
│   └── demo-docs/      # Documentation site
└── .github/
    └── workflows/      # CI/CD pipelines
```

## Package Naming Convention

All packages follow the format: `privacy-utils-{package-name}`

- `privacy-utils-core-crypto` - Core cryptographic primitives
- `privacy-utils-dp` - Differential Privacy mechanisms
- `privacy-utils-secure-agg` - Secure Aggregation protocols
- `privacy-utils-anon-auth` - Anonymous Authentication helpers
- `privacy-utils-utils` - Mathematical and statistical utilities

## Code Style Guidelines

### TypeScript

- Use TypeScript 5.5+ features
- Strict type checking enabled
- Prefer interfaces over types for object definitions
- Use `readonly` for immutable properties
- Document complex types with JSDoc comments

### Cryptography

- Use Web Crypto API when possible
- Fall back to noble libraries for Node.js
- Never implement custom cryptographic primitives
- Always use constant-time operations for sensitive data
- Validate all inputs thoroughly

### Testing

- Write unit tests for all functions
- Use descriptive test names
- Test edge cases and error conditions
- Aim for high test coverage (>80%)
- Use Vitest for testing framework

### Documentation

- Document all public APIs with JSDoc
- Include usage examples in doc comments
- Keep README files up to date
- Document security considerations for crypto functions

## Security Considerations

When contributing to this project:

1. **Never implement custom cryptography** - use well-reviewed libraries
2. **Validate all inputs** - prevent injection attacks
3. **Use constant-time operations** - prevent timing attacks
4. **Handle sensitive data carefully** - avoid logging secrets
5. **Follow the principle of least privilege** - minimal required permissions

## Getting Help

- **Issues**: Report bugs and request features
- **Discussions**: Ask questions and discuss ideas
- **Documentation**: Check the README and API docs first
- **Code Examples**: Look at the examples in `/apps/examples/`

## License

By contributing to Privacy Utils, you agree that your contributions will be licensed under the MIT License.
