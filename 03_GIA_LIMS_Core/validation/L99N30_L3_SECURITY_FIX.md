# L3 Security Fix Evidence

- OIDC callback no longer returns provider access tokens to the browser/client response.
- Dependency ranges are pinned to exact declared versions in package.json.
- npm lockfile generation was attempted but blocked by network timeout; no fabricated lockfile was added.
- Release must not claim SLSA/SBOM/Cosign/in-toto verification until independently generated and verified.
