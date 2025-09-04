# Release Scripts

This directory contains scripts for creating GitHub releases.

## create-release.js

Creates a GitHub release for the current version using the GitHub API.

### Prerequisites

- Node.js 18+
- GitHub Personal Access Token with `repo` permissions

### Usage

1. Set your GitHub token:
```bash
export GITHUB_TOKEN=your_github_token_here
```

2. Run the script:
```bash
node scripts/create-release.js
```

### Manual Release Creation

If you prefer to create the release manually:

1. Go to [GitHub Releases](https://github.com/sicmundu/privacy-utils/releases)
2. Click "Create a new release"
3. Set tag to `v0.1.0`
4. Set title to `Privacy Utils v0.1.0`
5. Copy the release notes from the script above
6. Publish the release

## Alternative: Using curl

```bash
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_name": "v0.1.0",
    "name": "Privacy Utils v0.1.0",
    "body": "Release notes here...",
    "draft": false,
    "prerelease": false
  }' \
  https://api.github.com/repos/sicmundu/privacy-utils/releases
```
