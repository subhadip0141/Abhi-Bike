# Pre-push review ? 5 October 2026

## Fixed

- Corrected the configured WhatsApp number from a formatted string to digits only; the old string failed validation and blocked every booking enquiry.
- Replaced missing booking-page gallery sources with the existing trains.webp image and updated the preload type.
- Applied the owner's confirmed Siliguri pickup location and business address consistently, while keeping Darjeeling as a travel destination.
- Replaced the Contact page's unpublished-phone placeholder with the existing business number.
- Corrected tourist-map alt text and image dimension attributes.
- Removed unused texture overlays, placeholder styles and duplicate image preloads.
- Restricted the local preview server to public website assets, added HEAD support, and blocked private files such as .git/config.

## Repository preparation

Added Git ignore rules, line-ending rules, editor settings, a dependency-free package manifest and lockfile, a root entry point, .nojekyll, validation scripts, regression tests and a GitHub Actions check workflow. Preserved the original design brief and bundled font/icon licenses.

Removed 23 obsolete generated files and the unused grain texture. New browser screenshots and reports stay local and are ignored by Git.

## Validation

- Six HTML documents and all local asset/link/fragment references checked.
- Four regression tests passed for booking selection, URL encoding, invalid input and preview-server access.
- All five product pages passed browser checks at seven widths (35 layouts), with no broken images, unresolved icons, horizontal page overflow or mobile tourist-map cropping.
- All nine catalogue links prefill the booking form; unknown bike queries are ignored.
- Fleet search, empty results, mobile menu and WhatsApp validation passed in Chrome.
- Selected desktop/mobile screenshots were visually inspected.

Chrome required the opt-in no-sandbox setting inside this restricted test environment; the test uses a separate temporary profile and a localhost-only server. Production customer browsing is unaffected.

No messages were sent. External Google Maps destination, business availability and rental prices were not independently verified. No Git commit or push was made; this repository has no configured remote.
