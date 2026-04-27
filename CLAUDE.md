# Eterna CLI

## Releases

This repo uses [Release Please](https://github.com/googleapis/release-please) for automated releases and changelog generation.

**Always use [Conventional Commits](https://www.conventionalcommits.org/)** so Release Please can determine the correct semantic version bump:

- `fix:` → patch (0.0.X)
- `feat:` → minor (0.X.0)
- `feat!:` or `BREAKING CHANGE:` → major (X.0.0)

Examples:
```
fix: parse JSON error bodies in execute failures
feat: add `eterna status` command
feat: add inline code execution via `-e` flag
```
