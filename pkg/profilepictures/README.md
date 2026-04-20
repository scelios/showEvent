# Profile Pictures Extension

This extension replaces the default Rancher user avatar with a Gravatar image derived from the authenticated user email.

- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Security and Privacy Notes](#security-and-privacy-notes)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)

## Installation

Install this extension from the Rancher Catalog:
1. Open **Extensions** in the Rancher dashboard.
2. Search for **Profile Pictures**.
3. Click **Install**.

## Usage

After installation, the extension runs automatically. When a valid user email is found in the Rancher authentication token, the extension computes a Gravatar hash and updates the avatar shown in the top navigation menu.

If no email is available, or if token decoding fails, Rancher keeps the default avatar.

## Architecture

The extension uses two main modules:

- **JWT email extraction**: reads the `R_OIDC_ID` cookie, decodes the token payload, and returns the `email` claim when present.
- **Avatar patcher**: watches DOM updates, locates the avatar element, and updates its `src` attribute with a Gravatar URL.

Flow summary:
1. Read token from cookie.
2. Decode token and extract email.
3. Normalize email and compute SHA-256 hash.
4. Build Gravatar URL with `d=identicon` fallback.
5. Replace avatar image source in Rancher navigation.

## Security and Privacy Notes

- The extension does not persist JWT tokens.
- User email is used only to derive a hash for Gravatar.

## Limitations

- Requires a token cookie that contains an `email` claim.
- Depends on Gravatar availability and network access.
- Uses DOM selectors tied to Rancher UI markup; future UI changes may require selector updates.

## Troubleshooting

### Avatar does not change

Possible causes:
- No `R_OIDC_ID` cookie is available.
- JWT payload has no `email` claim.
- Network access to `secure.gravatar.com` is blocked.
