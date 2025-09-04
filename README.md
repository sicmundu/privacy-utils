# Privacy Utils

[![CI](https://github.com/privacy-utils/privacy-utils/workflows/CI/badge.svg)](https://github.com/sicmundu/privacy-utils/actions)
[![npm version](https://img.shields.io/npm/v/privacy-utils-core-crypto.svg)](https://www.npmjs.com/package/privacy-utils-core-crypto)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)

A modular TypeScript library for implementing privacy-preserving technologies in web applications. Provides differential privacy, secure aggregation, and anonymous authentication primitives with a focus on security, performance, and developer experience.

## Features

### Differential Privacy (`privacy-utils-dp`)
- **Noise Mechanisms**: Laplace, Gaussian, and Discrete Gaussian mechanisms
- **Privacy Budget Management**: Advanced composition, tracking, and validation
- **Ready-to-Use Tasks**: Count, sum, mean, histogram with automatic noise injection
- **Flexible Budget Control**: Epsilon-delta privacy guarantees with composition support

### Secure Aggregation (`privacy-utils-secure-agg`)
- **Pairwise Masking**: Deterministic masking with shared secrets
- **Dropout Tolerance**: Shamir's secret sharing for client failure recovery
- **WebSocket Integration**: Real-time aggregation protocols
- **Multi-Party Computation**: Secure federated learning primitives

### Anonymous Authentication (`privacy-utils-anon-auth`)
- **VOPRF Tokens**: Verifiable oblivious pseudorandom functions for token issuance
- **Blind Hashes**: Privacy-preserving hash verification without revealing inputs
- **WebAuthn Ephemeral**: One-time WebAuthn keys for anonymous sessions
- **Rate Limiting**: Built-in protection against abuse

### Core Cryptography (`privacy-utils-core-crypto`)
- **Web Crypto API**: Native browser/Node.js cryptographic primitives
- **Key Derivation**: HKDF with configurable parameters
- **Message Authentication**: HMAC with multiple hash functions
- **Authenticated Encryption**: AEAD with GCM mode
- **Secure Random**: Cryptographically secure random number generation

## Quick Start

### Installation

```bash
# Install individual packages as needed
npm install privacy-utils-dp privacy-utils-core-crypto
# or
pnpm add privacy-utils-dp privacy-utils-core-crypto
# or
yarn add privacy-utils-dp privacy-utils-core-crypto
```

### Basic Usage

#### Differential Privacy

```typescript
import { dpCount, createBudgetTracker } from 'privacy-utils-dp';
import { random } from 'privacy-utils-core-crypto';

// Create a privacy budget
const budget = createBudgetTracker({ epsilon: 1.0 });

// Add noise to a count query
const trueCount = 100;
const noisyCount = dpCount(trueCount, { epsilon: 0.5 }, budget);

console.log(`True count: ${trueCount}`);
console.log(`Noisy count: ${noisyCount}`);
console.log(`Remaining budget: ${budget.getRemainingBudget()}`);
```

#### Secure Aggregation

```typescript
import { createSAClient, createSAAggregator } from 'privacy-utils-secure-agg';

// Client-side aggregation
const client = createSAClient({
  clientId: 'client-1',
  serverUrl: 'ws://localhost:8080',
  vectorSize: 100
});

// Submit private data
await client.connect();
await client.submitVector(new Float64Array([1, 2, 3, ...]));
const result = await client.getAggregationResult();
```

#### Anonymous Authentication

```typescript
import { createBlindHash, verifyBlindHash } from 'privacy-utils-anon-auth';

// Create a blind hash for anonymous verification
const serverKey = crypto.getRandomValues(new Uint8Array(32));
const blindHash = await createBlindHash("user@example.com", serverKey);

// Server processes without seeing the original input
const serverResponse = await processBlindHash(blindHash.blindedInput, serverKey);

// Client verifies the response
const isValid = await verifyBlindHash(blindHash, serverResponse, serverKey);
```

## Packages

| Package | Description | Size |
|---------|-------------|------|
| `privacy-utils-core-crypto` | Cryptographic primitives | ~11 KB |
| `privacy-utils-dp` | Differential Privacy mechanisms | ~8.8 KB |
| `privacy-utils-secure-agg` | Secure Aggregation protocols | ~21.4 KB |
| `privacy-utils-anon-auth` | Anonymous Authentication helpers | ~14.6 KB |
| `privacy-utils-utils` | Mathematical utilities | ~1.7 KB |

## Architecture

```
privacy-utils/
├── packages/                 # Modular packages
│   ├── core-crypto/         # Cryptographic primitives
│   ├── dp/                  # Differential Privacy
│   ├── secure-agg/          # Secure Aggregation
│   ├── anon-auth/           # Anonymous Authentication
│   └── utils/               # Utilities
├── tooling/                 # Development tools
│   ├── eslint-config/       # Strict linting rules
│   └── tsconfig/           # TypeScript configs
├── apps/                    # Applications
│   ├── examples/           # Usage examples
│   └── demo-docs/          # Interactive documentation
└── .github/                # CI/CD workflows
```

## Security

Privacy Utils prioritizes security through:

- **Audited Cryptography**: Only uses well-reviewed cryptographic libraries
- **Web Crypto API**: Native browser cryptographic implementations
- **Constant-Time Operations**: Protection against timing attacks
- **Input Validation**: Comprehensive input sanitization
- **Memory Safety**: Secure memory handling for sensitive data

### Security Audit

This project uses automated security scanning and dependency analysis. All cryptographic implementations follow industry best practices and are regularly updated.

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter privacy-utils-dp test

# Run tests in watch mode
pnpm test -- --watch

# Run browser tests
pnpm test:browser
```

## Documentation

### API Reference
- [Core Crypto API](packages/core-crypto/README.md)
- [Differential Privacy API](packages/dp/README.md)
- [Secure Aggregation API](packages/secure-agg/README.md)
- [Anonymous Authentication API](packages/anon-auth/README.md)

### Examples
- [Basic Usage Examples](apps/examples/)
- [Integration Guides](docs/guides/)
- [Security Best Practices](docs/security/)

## Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- TypeScript 5.5+

### Setup
```bash
git clone https://github.com/privacy-utils/privacy-utils.git
cd privacy-utils
pnpm install
pnpm build
```

### Development Scripts
```bash
# Build all packages
pnpm build

# Run type checking
pnpm typecheck

# Lint code
pnpm lint

# Run tests
pnpm test

# Start development mode
pnpm dev
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Areas for Contribution
- **New Mechanisms**: Additional DP mechanisms or crypto primitives
- **Performance**: Optimization of existing algorithms
- **Documentation**: Examples, guides, and API documentation
- **Testing**: Additional test cases and browser compatibility
- **Security**: Security audits and vulnerability research

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Turbo](https://turbo.build/) for fast builds
- Uses [Vitest](https://vitest.dev/) for testing
- Powered by [TypeScript](https://www.typescriptlang.org/)
- Cryptography provided by [@noble](https://github.com/paulmillr/noble-curves)

## Support

- **Issues**: [GitHub Issues](https://github.com/privacy-utils/privacy-utils/issues)
- **Discussions**: [GitHub Discussions](https://github.com/privacy-utils/privacy-utils/discussions)
- **Documentation**: [Full Documentation](https://privacy-utils.dev)

---

**Privacy Utils** - Making privacy-preserving technologies accessible to every developer.
