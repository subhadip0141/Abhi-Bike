# ABHI Bike Rental — Website Design System

## 1. Product Overview

**Brand:** ABHI Bike Rental  
**Primary goal:** Let customers quickly discover an available bike, choose a rental duration/location, understand pricing, and complete a booking with minimal friction.

The website should feel like a **modern Indian mobility/rental brand**: reliable, energetic, outdoors-oriented, practical, and premium without looking overly luxurious.

The provided ABHI Bike Rental logo is the source of truth for branding. **Use the supplied logo asset exactly; do not redraw, distort, crop, recolor, or add effects to the logo.**

Recommended asset location in the web project:

```text
/public/brand/abhi-bike-rental-logo.png
```

Also create:

```text
/public/brand/favicon.png
/public/brand/og-image.png
```

---

# 2. Design Direction

### Visual keywords

- Modern
- Clean
- Adventure
- Trustworthy
- Fast booking
- Indian road-trip energy
- Premium but affordable
- Mobile-first

### Avoid

- Generic corporate SaaS styling
- Excessive glassmorphism
- Heavy gradients
- Neon gaming aesthetics
- Crowded screens
- Too many colors
- Tiny text
- Fake 3D motorcycle illustrations
- Overdecorating the logo

The logo already communicates motorcycle + mountains + road + nature. The website should support that visual language rather than competing with it.

---

# 3. Brand Color System

The palette is derived from the supplied logo.

| Token | Color | Usage |
|---|---|---|
| `brand-navy` | `#012851` | Primary text, navbar, buttons, headings |
| `brand-green` | `#0C8128` | Success states, nature/adventure accents, selected availability |
| `brand-orange` | `#FEB103` | Main highlight, offers, badges, CTA accents |
| `brand-blue` | `#018DEC` | Maps, links, secondary actions, information |
| `brand-red` | `#E51B23` | Rental price emphasis, alerts, urgent labels |
| `white` | `#FFFFFF` | Main surfaces |
| `off-white` | `#F6F8FA` | Page backgrounds |
| `text-muted` | `#667085` | Secondary text |
| `border` | `#E4E7EC` | Cards, inputs, dividers |
| `success-bg` | `#EAF7EE` | Available/confirmed states |
| `warning-bg` | `#FFF5D8` | Warnings/offers |
| `danger-bg` | `#FEECEE` | Errors/unavailable states |

### Color rules

Use navy as the dominant brand color.

Recommended visual ratio:

```text
Navy / neutral: ~70%
White / off-white: ~20%
Green + blue + orange + red accents: ~10%
```

Do not use orange, blue, green, and red equally across the interface. Each accent has a specific job.

---

# 4. Typography

Use a clean geometric sans-serif.

### Preferred font

```text
Inter
```

Fallback:

```text
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

### Type scale

```text
Display:       56px / 1.05 / 700
Hero H1:       48px / 1.08 / 700
H2:            36px / 1.15 / 700
H3:            24px / 1.2 / 650
H4:            18px / 1.3 / 650

Body large:    18px / 1.55 / 400
Body:          16px / 1.55 / 400
Body small:    14px / 1.45 / 400
Caption:       12px / 1.4 / 500
```

### Typography behavior

- Keep headings short.
- Use sentence case for UI text.
- Do not use all-caps for entire paragraphs.
- Use bold weight for price and booking actions.
- Maintain strong contrast against backgrounds.

---

# 5. Layout System

### Desktop

```text
Max content width: 1200–1280px
Page side padding: 24px
Section vertical spacing: 80–112px
Card radius: 18–24px
Button radius: 12–14px
Input height: 52–56px
```

### Tablet

```text
Max width: 960px
Side padding: 20px
Section spacing: 64–80px
```

### Mobile

```text
Side padding: 16px
Section spacing: 48–64px
Card radius: 16–20px
Input/button height: 52px minimum
```

Use a responsive 12-column grid on desktop and collapse naturally to 1–2 columns on smaller screens.

---

# 6. Overall Site Structure

```text
Home
├── Hero / Booking Search
├── Popular Bikes
├── Why ABHI
├── How It Works
├── Popular Rental Locations
├── Offers / Weekend Deals
├── Road Trip / Adventure Banner
├── Customer Reviews
├── FAQ
└── Footer

Bikes
├── Filters
├── Bike Grid
└── Bike Detail

Locations
├── Search
├── Interactive Map
└── Location Cards

How It Works
├── Step 1: Choose Bike
├── Step 2: Choose Location & Dates
├── Step 3: Verify & Pay
└── Step 4: Pick Up & Ride

About
├── Brand Story
├── Mission
├── Trust & Safety
└── Fleet Highlights

Contact
├── Contact details
├── WhatsApp CTA
├── Contact form
└── FAQ

Booking
├── Select bike
├── Date/time
├── Pickup/drop location
├── Customer details
├── Price summary
├── Payment
└── Confirmation
```

---

# 7. Header / Navigation

Create a clean sticky header.

### Desktop

Left:

```text
[ABHI logo]
```

Center/right:

```text
Home
Bikes
Locations
How It Works
About
Contact
```

Far right:

```text
[Login]
[Book a Bike]
```

`Book a Bike` should be the strongest header action.

### Header behavior

- White background by default.
- Subtle bottom border.
- Sticky on scroll.
- Slight shadow only after scrolling.
- Logo height around 42–52px.
- Do not alter logo proportions.

### Mobile

Show:

```text
[ABHI logo]                         [Menu]
```

Open a full-height/large drawer containing navigation and a prominent `Book a Bike` button.

---

# 8. Homepage

## 8.1 Hero Section

Hero should immediately answer:

> What does ABHI Bike Rental offer, and how do I rent a bike?

### Recommended composition

Left side:

```text
Ride More.
Explore More.

Reliable bikes for city rides, weekend trips,
and unforgettable road adventures.

[Pick-up location]
[Start date] [End date]

[Find Bikes]
```

Right side:

Use a high-quality motorcycle photograph showing an Indian road/adventure environment.

The photo should have natural lighting and enough negative space so the UI still feels clean.

### Hero backdrop

Use:

- White/off-white base
- Very subtle blue/green environmental shapes
- Optional soft photographic section edge
- No strong gradient behind the logo

The supplied logo can appear in the navigation and footer; avoid placing a giant duplicate logo over the hero unless it is compositionally necessary.

---

# 9. Booking Search Component

This is the most important functional UI on the homepage.

### Desktop layout

```text
┌───────────────────────────────────────────────────────────────┐
│ Pickup Location │ Start │ End │ Bike Type │  FIND BIKES      │
└───────────────────────────────────────────────────────────────┘
```

### Mobile layout

Stack into:

```text
Pickup Location
Start Date
End Date
Bike Type
[Find Bikes]
```

### Form behavior

- Location autocomplete
- Date picker
- Time selector
- Bike-type selector
- Validation before search
- Disable impossible dates
- Clear error messages
- Preserve entered search values when navigating to results

Use orange for the primary booking action and navy for text.

---

# 10. Popular Bikes Section

Title:

```text
Choose Your Ride
```

Subtitle:

```text
From everyday commuters to weekend adventure machines.
```

### Bike card

Each card should include:

```text
[Large motorcycle image]

AVAILABLE
Royal Enfield Classic 350

Classic
350cc • Petrol • Manual

₹999 / day

[View Details]
[Book Now]
```

### Card behavior

- Image ratio around 4:3.
- Clean white surface.
- Rounded corners.
- Very subtle border/shadow.
- Hover: image slightly zooms (2–3%) and card lifts by a few pixels.
- Do not over-animate.

### Availability

Use green for:

```text
Available
```

Use muted gray for:

```text
Limited
```

Use red only for:

```text
Unavailable
```

---

# 11. Bike Detail Page

Structure:

```text
Breadcrumbs

Large Image Gallery       Bike Information
                          Bike name
                          Rating
                          ₹ price/day
                          Availability
                          Specifications
                          [Book Now]

Description

Features

Rental Terms

Location / Pickup

Frequently Asked Questions
```

### Specifications grid

Example:

```text
Engine          350cc
Transmission    Manual
Fuel            Petrol
Mileage         35 km/l
Seats           2
Type            Cruiser
```

Make this easy to scan rather than paragraph-heavy.

---

# 12. Why ABHI Section

Use four simple feature cards.

```text
01  Well-Maintained Bikes
    Clean, inspected and ready to ride.

02  Transparent Pricing
    Know what you pay before booking.

03  Easy Pickup
    Convenient pickup and drop locations.

04  Rider Support
    Quick assistance whenever you need it.
```

Use small line icons, not oversized illustrations.

Accent icons can use the brand green, blue, orange, and navy.

---

# 13. How It Works

Use a horizontal 4-step process on desktop.

```text
① Choose a Bike
      ↓
② Pick Date & Location
      ↓
③ Complete Booking
      ↓
④ Pick Up & Ride
```

On mobile, convert this to a vertical timeline.

Add a small visual connector between steps.

---

# 14. Locations Section

Purpose: communicate that customers can find ABHI bikes in convenient locations.

### UI

Left:

```text
Find a Bike Near You

[Search city / area]
```

Right:

Interactive map.

Below:

Location cards such as:

```text
[Location image]
Kolkata
Multiple pickup options
[Explore]
```

The map should be visually secondary to the booking flow.

---

# 15. Offers / Deals

Create a visually stronger section using the brand orange.

Example:

```text
Weekend Ride Deal

Get special rates on selected bikes
for weekend bookings.

[Explore Deals]
```

Use photography rather than a loud promotional graphic.

Offer cards should clearly show:

```text
Offer
Code
Valid dates
Terms
```

Avoid fake urgency such as unsupported countdown timers.

---

# 16. Adventure Banner

Create a full-width image section.

Suggested headline:

```text
Your Next Ride Starts Here.
```

Supporting copy:

```text
City commute or open-road adventure —
choose the bike that fits your journey.
```

CTA:

```text
Explore Bikes
```

Use a dark photographic background with high-contrast white text.

A subtle navy overlay is allowed for readability.

---

# 17. Reviews

Section title:

```text
Riders Love the Ride
```

Use 3 review cards on desktop and a horizontal swipe/scroll carousel on mobile.

Each card:

```text
★★★★★
“Clean bike, easy booking and smooth pickup.”

Customer Name
Verified Rental
```

Do not invent testimonials for the production site. Use real customer reviews or clearly marked placeholder content during development.

---

# 18. FAQ

Use an accordion.

Recommended questions:

```text
What documents do I need to rent a bike?
What is included in the rental price?
What is the security deposit?
Can I extend my booking?
What happens if the bike has a problem?
Can I cancel my booking?
Do you offer pickup and drop services?
```

Accordion interaction:

- Smooth open/close.
- Only one or multiple items may stay open.
- Keyboard accessible.
- Clear focus state.

---

# 19. Footer

Use a dark navy footer.

Layout:

```text
[ABHI logo]

Ride with confidence.
Explore without limits.

Company
About
Bikes
Locations
Contact

Support
FAQs
Rental Terms
Privacy Policy
Cancellation Policy

Contact
Phone
WhatsApp
Email
```

Bottom:

```text
© ABHI Bike Rental
```

Use white logo if a dedicated white logo asset is supplied later. Until then, use the original logo only where its background provides sufficient contrast.

---

# 20. Booking Flow

The booking experience should feel much simpler than a traditional travel-booking website.

### Step 1 — Search

```text
Location
Date
Time
Bike Type
```

### Step 2 — Select Bike

Show:

```text
Bike photo
Bike name
Specs
Daily rate
Availability
```

### Step 3 — Customer Information

```text
Name
Phone
Email
Driving licence details
```

Only request information that is genuinely required.

### Step 4 — Price Summary

Example:

```text
Bike rental       ₹1,500
Duration          2 days
Helmet            Included
Taxes             ₹270
Security deposit  ₹2,000
──────────────────────────
Total             ₹3,770
```

Clearly distinguish:

- rental price
- taxes/fees
- refundable security deposit

### Step 5 — Confirmation

Show:

```text
Booking Confirmed ✓

Booking ID
Bike
Pickup location
Date & time
Amount paid

[View Booking]
[Get Directions]
[Contact Support]
```

---

# 21. Pricing UI

Always show the base rental price prominently.

Preferred:

```text
₹999
/day
```

Avoid:

```text
Starts at only 999!!!
```

Use Indian currency formatting:

```text
₹1,299
₹2,499
₹9,999
```

---

# 22. Buttons

### Primary

```text
Background: #012851
Text: #FFFFFF
```

For major conversion actions, orange can be used:

```text
Background: #FEB103
Text: #012851
```

### Secondary

```text
White background
Navy text
Navy border
```

### Success

```text
Green background
White text
```

### Destructive

```text
Red background
White text
```

### Button rules

- Minimum height: 48px.
- Mobile: preferably 52–56px.
- Clear action verbs.
- Never use vague labels like `Submit` for important actions.

Preferred labels:

```text
Find Bikes
View Details
Book Now
Continue
Confirm Booking
Pay Securely
Contact Support
```

---

# 23. Form Design

Inputs should be large enough for mobile users.

```text
Label
[ Input                                      ]
Helper text
```

Use:

- clear labels
- visible focus state
- inline validation
- correct input types
- accessible error text

Never rely on placeholder text as the only label.

---

# 24. Icons

Use one consistent icon family throughout the product.

Suitable choices:

- Lucide
- Phosphor
- Material Symbols

Recommended icon style:

```text
2px stroke
rounded joins
minimal detail
```

Do not mix multiple icon styles.

---

# 25. Imagery

The website should use real motorcycle photography.

### Image direction

Look for photography showing:

- Indian roads
- mountains
- forests
- urban riding
- riders wearing helmets
- motorcycles in natural environments

### Image treatment

Use:

```text
border-radius: 18–24px
object-fit: cover
```

Avoid placing text directly over busy images without an overlay.

Do not use low-quality generated motorcycle images for actual fleet listings.

---

# 26. Motion & Micro-interactions

Animations should feel premium and restrained.

### Recommended

- 150–250ms hover transitions
- card lift of 2–4px
- subtle image zoom
- button press feedback
- smooth drawer transitions
- skeleton loading for search results
- accordion height transitions

### Avoid

- spinning logos
- constant floating animations
- parallax everywhere
- excessive blur
- long page transition animations

Respect:

```text
prefers-reduced-motion
```

---

# 27. Responsive Behavior

### Desktop ≥ 1200px

Use:

- full navigation
- 3/4-column bike grid
- side-by-side hero
- horizontal booking widget

### Tablet 768–1199px

Use:

- compact navigation
- 2-column bike grid
- hero can remain two-column
- booking widget may wrap

### Mobile < 768px

Use:

- hamburger menu
- 1-column bike grid
- stacked booking form
- sticky bottom `Book Now` CTA where useful
- horizontally scrollable categories
- large touch targets

Never allow horizontal page scrolling.

---

# 28. Accessibility

Target WCAG 2.2 AA-level usability.

Requirements:

- Keyboard navigation
- Visible focus indicators
- Semantic HTML
- Proper form labels
- Alt text for meaningful images
- Decorative images marked appropriately
- Sufficient color contrast
- Accessible modal/drawer behavior
- Accessible accordions
- Error messages that explain how to fix the issue

Do not communicate availability using color alone.

For example:

```text
● Available
```

should also include the text:

```text
Available
```

---

# 29. SEO

Homepage title:

```text
ABHI Bike Rental | Rent Bikes Easily
```

Example meta description:

```text
Rent reliable bikes with ABHI Bike Rental.
Choose your bike, location and dates, then book your ride online.
```

Use structured headings:

```text
H1 → primary page purpose
H2 → major sections
H3 → cards/subsections
```

Each bike detail page should have its own:

- title
- description
- canonical URL
- Open Graph image
- structured product/service data where appropriate

---

# 30. Performance

The site should prioritize fast mobile loading.

### Requirements

- WebP/AVIF for large photos
- Responsive image sizes
- Lazy-load below-the-fold images
- Avoid huge JavaScript bundles
- Use optimized logo assets
- Reserve image space to prevent layout shift
- Compress all fleet photos
- Use skeleton states instead of blocking empty screens

Target a fast, responsive feel on mid-range Android phones and average Indian mobile networks.

---

# 31. Suggested Component Architecture

```text
components/
├── Navbar
├── MobileMenu
├── Hero
├── BookingSearch
├── LocationSelector
├── DateRangePicker
├── BikeCard
├── BikeGrid
├── BikeSpecs
├── AvailabilityBadge
├── PriceDisplay
├── FeatureCard
├── HowItWorks
├── LocationCard
├── Map
├── OfferCard
├── ReviewCard
├── FAQAccordion
├── Footer
├── BookingSummary
└── Toast
```

---

# 32. Suggested Data Models

## Bike

```ts
type Bike = {
  id: string
  name: string
  brand: string
  category: string
  engineCc: number
  transmission: string
  fuel: string
  seats: number
  pricePerDay: number
  deposit: number
  image: string
  gallery: string[]
  locationIds: string[]
  availability: "available" | "limited" | "unavailable"
}
```

## Location

```ts
type Location = {
  id: string
  name: string
  city: string
  address: string
  latitude: number
  longitude: number
  openingTime: string
  closingTime: string
}
```

## Booking

```ts
type Booking = {
  id: string
  bikeId: string
  locationId: string
  startDate: string
  endDate: string
  customerName: string
  phone: string
  email: string
  status: "pending" | "confirmed" | "cancelled"
  totalAmount: number
}
```

---

# 33. Navigation URLs

Recommended route structure:

```text
/
/bikes
/bikes/:slug
/locations
/how-it-works
/about
/contact
/offers
/booking
/booking/confirmation/:id
/terms
/privacy
/cancellation-policy
```

---

# 34. Homepage Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ ABHI LOGO       Home Bikes Locations About Contact   BOOK NOW│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Ride More.                         [ Motorcycle Image ]      │
│  Explore More.                                               │
│                                                              │
│  Reliable bikes for city rides,                              │
│  weekend trips and adventures.                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Location │ Start │ End │ Bike Type │ Find Bikes       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                      CHOOSE YOUR RIDE                         │
│     [Bike Card]      [Bike Card]      [Bike Card]             │
├──────────────────────────────────────────────────────────────┤
│                         WHY ABHI                              │
│      [01]             [02]             [03]          [04]      │
├──────────────────────────────────────────────────────────────┤
│                       HOW IT WORKS                            │
│                 01 → 02 → 03 → 04                            │
├──────────────────────────────────────────────────────────────┤
│                    FIND US NEAR YOU                           │
│                       [ MAP ]                                 │
├──────────────────────────────────────────────────────────────┤
│                       WEEKEND DEAL                            │
│                   [Adventure Image]                           │
├──────────────────────────────────────────────────────────────┤
│                     RIDERS LOVE THE RIDE                      │
│              [Review] [Review] [Review]                       │
├──────────────────────────────────────────────────────────────┤
│                           FAQ                                 │
├──────────────────────────────────────────────────────────────┤
│                          FOOTER                               │
└──────────────────────────────────────────────────────────────┘
```

---

# 35. Design Tokens

Example CSS variables:

```css
:root {
  --brand-navy: #012851;
  --brand-green: #0C8128;
  --brand-orange: #FEB103;
  --brand-blue: #018DEC;
  --brand-red: #E51B23;

  --bg: #FFFFFF;
  --bg-soft: #F6F8FA;

  --text: #012851;
  --text-muted: #667085;

  --border: #E4E7EC;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  --shadow-sm: 0 2px 10px rgba(1, 40, 81, 0.06);
  --shadow-md: 0 10px 30px rgba(1, 40, 81, 0.10);

  --container: 1240px;
}
```

---

# 36. UI Personality

The interface should communicate:

```text
ABHI = EASY + RELIABLE + ADVENTUROUS
```

A visitor should understand the product within a few seconds:

1. ABHI rents bikes.
2. Bikes can be searched by location and dates.
3. Pricing is visible.
4. Booking is easy.
5. ABHI is connected to travel/adventure.

---

# 37. Conversion Priorities

Prioritize the interface in this order:

```text
1. Find Bikes
2. View available bikes
3. Compare price/specifications
4. Book
5. Contact support
```

Do not bury the booking action below multiple informational sections.

On mobile, make `Book Now` easy to reach.

---

# 38. Trust Signals

Add real trust indicators when available:

```text
✓ Verified business
✓ Well-maintained fleet
✓ Transparent pricing
✓ Secure payments
✓ Customer support
```

Only display claims that the business can substantiate.

Do not invent certifications, fleet counts, ratings, customer numbers, or guarantees.

---

# 39. WhatsApp / Contact CTA

For an Indian bike-rental service, WhatsApp can be a useful support and conversion channel.

Recommended floating CTA:

```text
[WhatsApp]
```

Behavior:

- Fixed bottom-right on desktop.
- Avoid covering the mobile booking CTA.
- Open a pre-filled message such as:

```text
Hi ABHI Bike Rental, I want to know about bike availability.
```

Only activate this once the business WhatsApp number is configured.

---

# 40. Final Design Principle

**The logo is the identity. The website is the experience.**

Keep the logo recognizable and untouched.

Use:

- navy for confidence
- green for mobility/nature
- blue for movement/information
- orange for energy/action
- red only for important price or warning states

The result should look like a real, production-ready bike-rental platform rather than a template.

The first screen must make the main action obvious:

```text
CHOOSE WHERE + WHEN → FIND YOUR BIKE → BOOK → RIDE
```
