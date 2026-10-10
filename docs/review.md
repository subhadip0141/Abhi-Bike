# Pre-commit review — 11 October 2026

## Changes reviewed

- Set filled buttons to #064576, with darker hover states and matching outlined controls.
- Renamed the scooter to TVS Ntorq B.P. Edition in the homepage, fleet, search metadata, accessible labels, booking links and dropdown.
- Updated the business phone and WhatsApp destination to +91 7001193713.
- Added the full Contact page address and updated pickup notes and FAQs to Ashapurna Sarani Road, near Siliguri Junction.
- Replaced the booking pickup text input with a required dropdown containing the current pickup location.
- Retained pickup and return time fields and validation requiring same-day returns after pickup; both times appear in the WhatsApp enquiry with AM/PM. Time fields have explicit AM/PM selectors and responsive widths, independent of the mobile native time-picker locale.
- Made the booking mountain icon scale and align at the header's right edge.
- Changed the customer WhatsApp input placeholder to xxxxxxxxx.
- Added the 13 supplied rental terms in a scrollable modal. Customers must check the agreement before opening WhatsApp. The enquiry includes their agreement. Closing the modal preserves booking details and resets consent.
- Renamed frontend/index.html to frontend/frontpage.html, updated all navigation and the root redirect, and adjusted documentation and checks.

## Review fixes

- Removed outdated hotel-pickup instructions from the Bikes, Contact and Booking FAQs.
- Updated README booking documentation for required times, pickup selection and terms acceptance.
- Extended browser checks to verify all 13 terms, the agreement gate, modal scrolling, visible actions, icon alignment and retained form details across seven widths.

## Validation

- npm test: ten tests passed, covering catalogue prefills, encoded WhatsApp details, invalid inputs, required times, explicit AM/PM selection, noon/midnight formatting, invalid 12-hour inputs, same-day time ordering, terms acceptance/cancellation and preview-server access controls.
- Six HTML documents and 229 local asset, link and fragment references passed validation.
- Browser checks passed for five pages at 375, 390, 430, 768, 1024, 1440 and 1920 pixels (35 layouts).
- Terms popup layout and consent checks passed at all seven widths. Desktop and mobile popup screenshots were visually inspected.
- All nine catalogue links prefill the booking form; unknown bike queries are ignored. Fleet filters and the mobile menu passed.
- Homepage content comparison confirmed the rename changed only the requested home links and scooter name.
- git diff --check passed.

Browser checks used CHROME_NO_SANDBOX=1 with a temporary profile and a localhost-only server because the default sandbox could not start the renderer in this restricted environment. Screenshots and reports remain ignored by Git. No customer messages were sent.

The supplied terms were implemented as provided; this was a code and behavior review. Google Maps destination, rental prices and availability were not independently verified.

## Commit preparation

Suggested commit message: Update rental details and require terms agreement before WhatsApp booking

Configured remote: https://github.com/subhadip0141/Abhi-Bike.git

No Git commit or push was made during this review.
