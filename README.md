# ABHI Bike Rental

A responsive static website for bike rentals based in Siliguri, with routes around Darjeeling and the surrounding hills. Built with HTML, CSS and plain JavaScript. There is no build step or backend.

## Run locally

Use Node.js 22 or newer:

```sh
npm start
```

Open http://127.0.0.1:4173. On Windows PowerShell, use `npm.cmd start` if PowerShell blocks `npm.ps1`. No dependency installation is needed. You can also open `frontend/frontpage.html` directly.

## Checks

```sh
npm test
npm run check:browser
```

`npm test` checks local links, images, fragments, basic HTML accessibility attributes, JavaScript syntax, booking behavior and the preview server. It runs automatically on GitHub pushes and pull requests.

The optional browser check requires an installed Chrome/Chromium browser and Node.js 22+. Set `CHROME_PATH` if the browser is installed elsewhere. It checks all five pages at 375, 390, 430, 768, 1024, 1440 and 1920 pixels, including image loading, overflow, tourist map cropping, menus, carousel input, looping and booking. Booking tests intercept the outgoing URL and never send a WhatsApp message. Generated screenshots and reports are ignored by Git.

In a restricted execution environment where Chrome cannot start its renderer, the browser check supports `CHROME_NO_SANDBOX=1` for its isolated local test profile. Normal browser checks use Chrome's default sandbox.

## Project files

- `index.html`: root entry point linking and redirecting to the homepage.
- `frontend/`: Home (`frontpage.html`), Bikes, About, Contact and Booking pages.
- `css/`: shared styles, responsive rules and page styles; `brand.css` is loaded last to apply the current brand design.
- `js/`: navigation, the bike carousel, fallback fleet filters, booking logic and the local preview server.
- `assets/`: images, locally hosted fonts and icons.
- `scripts/` and `tests/`: validation and regression checks.
- `design.md`: original design brief, retained for reference.

## Business configuration

The Bikes page presents all nine bikes in a fixed two-column carousel. Scroll, swipe, ArrowUp/ArrowDown, PageUp/PageDown or use the on-screen buttons to change bikes. Names and images move in opposing directions with 1.5-second transitions; reduced motion changes states immediately. The booking link follows the active bike. The original catalogue remains available when JavaScript is disabled.

The business number is configured in `js/booking.js` as `917001193713` (country code and digits only). The Contact page uses the same number for its telephone link. Update both if the number changes. Google Maps links point to the location supplied by the owner: https://maps.app.goo.gl/iXBdDZEj4XmCJdsT9.

Customers can add multiple bikes from the carousel or catalogue without leaving the Bikes page. Cart links on every page open the booking form, where customers can review bikes or remove items. Each bike model can be added only once; there are no quantity controls. Bikes are added from the Bikes page. Only bike names and quantities are saved in this browser's local storage; customer contact details are not saved. A cart is specific to the browser and is not synced between devices. If storage is blocked, the page reports that the cart cannot be saved. Existing `booking.html?bike=...` links add a valid bike to the cart without adding duplicates.

The booking form validates names, phone numbers, dates, times and the pickup selection, then displays the rental terms. All bikes share the same rental dates and pickup details, and one WhatsApp enquiry lists every selected model and the total bike count. Empty carts cannot proceed. Customers must check the agreement checkbox before opening their WhatsApp enquiry; the message includes their agreement. Closing the terms keeps the form details and resets consent. Changing the cart, including in another tab, closes pending terms so the customer can review again. The cart stays saved after opening WhatsApp because sending an enquiry cannot be verified by this static website. Business dates use Asia/Kolkata time, and same-day returns must be after pickup. Availability, pricing and pickup are confirmed through WhatsApp; submitting the form does not confirm a booking or take payment.

Pickup is at Ashapurna Sarani Road, near Siliguri Junction, Pradhan Nagar, Siliguri, Darjeeling, West Bengal – 734003. The pickup dropdown currently offers this one location.

## Static hosting

Publish the project root with `index.html`, `frontend/`, `css/`, `js/` and `assets/` together. Relative paths also support hosting under a repository subdirectory. The root entry point and `.nojekyll` are included for static hosting. No environment file, database or build command is required. `js/serve.cjs` is only a local preview tool.

## Third-party licenses

Manrope's font license is in `assets/fonts/OFL.txt`. Lucide's icon license is in `js/vendor/lucide-LICENSE.txt`. Keep both when redistributing those assets. No license granting reuse of the site's business branding or photographs has been added.
