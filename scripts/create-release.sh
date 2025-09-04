#!/bin/bash

# GitHub Release Creation Script for Privacy Utils
# Usage: ./create-release.sh [GITHUB_TOKEN]

set -e

# Configuration
OWNER="sicmundu"
REPO="privacy-utils"
VERSION="0.1.0"
TAG="v${VERSION}"

# Get GitHub token from argument or environment
GITHUB_TOKEN="${1:-$GITHUB_TOKEN}"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GitHub token not provided"
    echo ""
    echo "Usage: $0 <GITHUB_TOKEN>"
    echo "Or set GITHUB_TOKEN environment variable"
    echo ""
    echo "Get token from: https://github.com/settings/tokens"
    exit 1
fi

echo "🚀 Creating GitHub release ${TAG}..."

# Release notes
RELEASE_NOTES=$(cat << 'EOF'
# Privacy Utils v0.1.0

## What's New

This is the initial release of Privacy Utils, a modular TypeScript library for implementing privacy-preserving technologies.

## Published Packages

- **privacy-utils-core-crypto@0.1.0** - Cryptographic primitives
- **privacy-utils-dp@0.1.0** - Differential Privacy mechanisms
- **privacy-utils-utils@0.1.0** - Mathematical utilities

## Features

### Differential Privacy
- Noise Mechanisms: Laplace, Gaussian, and Discrete Gaussian mechanisms
- Privacy Budget Management with advanced composition
- Ready-to-Use Tasks: Count, sum, mean, histogram with automatic noise injection
- Epsilon-delta privacy guarantees

### Core Cryptography
- Web Crypto API with Node.js compatibility
- Key Derivation (HKDF) with configurable parameters
- Message Authentication (HMAC) with multiple hash functions
- Authenticated Encryption (AEAD) with GCM mode
- Secure Random number generation

### Utilities
- Mathematical and statistical utilities
- L1/L2/Linf norm calculations
- Array clipping and statistical functions

## Installation

```bash
npm install privacy-utils-core-crypto privacy-utils-dp privacy-utils-utils
# or
pnpm add privacy-utils-core-crypto privacy-utils-dp privacy-utils-utils
```

## Quick Start

```typescript
import { dpCount, createBudgetTracker } from 'privacy-utils-dp';
import { random } from 'privacy-utils-core-crypto';

// Create a privacy budget
const budget = createBudgetTracker({ epsilon: 1.0 });

// Add noise to a count query
const noisyCount = dpCount(100, { epsilon: 0.5 }, budget);
```

## Links

- [Documentation](https://github.com/privacy-utils/privacy-utils#readme)
- [npm Packages](https://www.npmjs.com/search?q=privacy-utils)
- [GitHub Repository](https://github.com/privacy-utils/privacy-utils)

---

**Privacy Utils** - Making privacy-preserving technologies accessible to every developer.
EOF
)

# Create JSON payload
PAYLOAD=$(cat << EOF
{
  "tag_name": "${TAG}",
  "target_commitish": "main",
  "name": "Privacy Utils ${TAG}",
  "body": $(echo "$RELEASE_NOTES" | jq -R -s .),
  "draft": false,
  "prerelease": false
}
EOF
)

# Create release
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Privacy-Utils-Release-Script" \
  -d "$PAYLOAD" \
  "https://api.github.com/repos/${OWNER}/${REPO}/releases")

# Check response
if echo "$RESPONSE" | grep -q '"id":'; then
    echo "✅ GitHub Release created successfully!"
    echo "🔗 Release URL: https://github.com/${OWNER}/${REPO}/releases/tag/${TAG}"
    echo ""
    echo "Release details:"
    echo "$RESPONSE" | jq -r '.html_url'
else
    echo "❌ Failed to create release"
    echo "Response: $RESPONSE"
    exit 1
fi
