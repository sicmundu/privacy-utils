const https = require('https');
const { execSync } = require('child_process');

// GitHub repository information
const OWNER = 'sicmundu';
const REPO = 'privacy-utils';
const VERSION = '0.1.0';

// Get GitHub token from environment or prompt user
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Please set GITHUB_TOKEN environment variable');
  console.error('You can get a token from: https://github.com/settings/tokens');
  console.error('Example: export GITHUB_TOKEN=your_token_here');
  process.exit(1);
}

// Generate release notes
const releaseNotes = `# Privacy Utils v${VERSION}

## What's New

This is the initial release of Privacy Utils, a modular TypeScript library for implementing privacy-preserving technologies.

## Published Packages

- **privacy-utils-core-crypto@${VERSION}** - Cryptographic primitives
- **privacy-utils-dp@${VERSION}** - Differential Privacy mechanisms
- **privacy-utils-utils@${VERSION}** - Mathematical utilities

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

\`\`\`bash
npm install privacy-utils-core-crypto privacy-utils-dp privacy-utils-utils
# or
pnpm add privacy-utils-core-crypto privacy-utils-dp privacy-utils-utils
\`\`\`

## Quick Start

\`\`\`typescript
import { dpCount, createBudgetTracker } from 'privacy-utils-dp';
import { random } from 'privacy-utils-core-crypto';

// Create a privacy budget
const budget = createBudgetTracker({ epsilon: 1.0 });

// Add noise to a count query
const noisyCount = dpCount(100, { epsilon: 0.5 }, budget);
\`\`\`

## Links

- [Documentation](https://github.com/privacy-utils/privacy-utils#readme)
- [npm Packages](https://www.npmjs.com/search?q=privacy-utils)
- [GitHub Repository](https://github.com/privacy-utils/privacy-utils)

---

**Privacy Utils** - Making privacy-preserving technologies accessible to every developer.
`;

// Create release data
const releaseData = JSON.stringify({
  tag_name: `v${VERSION}`,
  target_commitish: 'main',
  name: `Privacy Utils v${VERSION}`,
  body: releaseNotes,
  draft: false,
  prerelease: false
});

// Create release via GitHub API
const options = {
  hostname: 'api.github.com',
  path: `/repos/${OWNER}/${REPO}/releases`,
  method: 'POST',
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'User-Agent': 'Privacy-Utils-Release-Script',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(releaseData)
  }
};

console.log(`Creating GitHub release v${VERSION}...`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('✅ GitHub Release created successfully!');
      console.log(`🔗 Release URL: https://github.com/${OWNER}/${REPO}/releases/tag/v${VERSION}`);
    } else {
      console.error('❌ Failed to create release:');
      console.error(`Status: ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error creating release:', error.message);
});

req.write(releaseData);
req.end();
