# BigBased authentication preparation — offline review only

**Date:** 2026-11-17. **Source:** [OpenTrestle PR #162](https://github.com/OpenTrestle/opentrestle-platform/pull/162), and especially docs/architecture/bigbased-auth-workstream-handoff-20261117.md. Reviewed at upstream head 6aec47e36db2d34e664aec4464eff8e93159a22a.

This folder is *not* the operational BigBased.com codebase. The repository currently contains an older BigBased.Tech landing site; do not treat this draft as authorization to deploy or replace the live v2.6 Creator Vault.

## Agreed architecture

- BigBased and MyBased are independent products/customer data and permission domains from OpenTrestle. BigBased may offer **Continue with OpenTrestle** as optional federated OIDC identity. Native BigBased-branded email sign-in remains primary. Preserve guest-first discovery.
- OpenTrestle is preparing Authentik. Its proposed auth.opentrestle.com hostname is NOT live and is NOT a verified OIDC issuer; provider-specific issuer and discovery metadata must be verified.
- Separate proposed relying-party callbacks: https://bigbased.com/auth/callback and https://mybased.ai/auth/callback. These are inert placeholders, not deployed routes.
- Use Authorization Code + PKCE S256, server-owned state/nonce and one-time callback transaction storage. Real token exchange, signature/JWKS, audience/issuer verification, revocation, secure HttpOnly/SameSite application cookies, CSRF defenses and tenant authorization require later independently reviewed work.
- OpenTrestle's current offline callback yields only an unverified code-exchange ticket. It does not issue a session.
- Verified external identities link by (issuer, subject), with explicit choice and step-up. Matching email is NEVER a linking credential. OpenTrestle login never gives BigBased customer rights or OpenTrestle Code/Console/Needs Me and execution authority.

## UX design states

1. Guest: public chat, Build, Explore and device-local Creator Vault remain available without account.
2. Sign-in choices: BigBased email and optional OpenTrestle appear as **unavailable / preview** until approved, not as successful sign-in.
3. Transfer preview: list local project copies, explain privacy and backup, ask which to migrate; NEVER upload automatically.
4. Future verified session: BigBased issues its own independently scoped session only after backend verification. This is NOT implemented.
5. Future conflicts: project version/name conflicts require review; preserve local original, allow cancel.
6. Future account linking/unlinking/recovery: explicit verification, step-up, redacted audit, safe last-recovery-method handling.
7. Errors: provider down, declined choice, wrong callback, expired/replayed state, duplicate email and tenant denial all fail closed.

## Proposed integration contracts (not operational API routes)

- GET /api/account/session — BigBased-owned authoritative session/capability result.
- POST /auth/oidc/start and GET /auth/callback — verified discovery and exact client callback, server-only, after private acceptance.
- GET /api/projects — BigBased tenant and membership checks, project versions/ETags.
- POST /api/projects/import/plan — no-write validation, selected project IDs, destination account, conflict preview.
- POST /api/projects/import/commit — explicit reconfirmation, CSRF, idempotency and version checks, audit, no local deletion.
- POST /api/account/identity-links/plan and /commit — server-verified issuer+subject and step-up, no email matching.
- DELETE /api/account/identity-links/{id} — step-up and recovery protection.

Sync must keep independent BigBased data ownership, tenant isolation, revision/conflict controls and draft/showcase/published states. Import never publishes. Sanitize all local backups before rendering and provide export/delete and privacy controls.

## Readiness dependencies

OpenTrestle G0–G3 and recovery approvals → private Authentik instance and verified discovery/JWKS/TLS → private tested login, logout, revocation and recovery → first-party OpenTrestle and SteadLamp acceptance → optional private BigBased OIDC client acceptance → independent BigBased customer storage, sessions, membership and migration privacy/security acceptance → separate explicit approval for public accounts, email, credentials, DNS and sync.

Do NOT create another Authentik deployment, DNS or mail sender, credentials, database, customer account, session, token, remote sync, production endpoints, AI execution or a fake successful sign-in.

## Offline tests

Run: node --test auth-prep/contract.test.mjs

This contract is deterministic and inert. Passing it proves only review seams and negative conditions, not Authentik installation, OIDC token validation, server security or connected customers.

An independent full v2.6-based interactive UX review page was generated and tested separately; it is not published, so the current BigBased Creator Launchpad remains unchanged.
