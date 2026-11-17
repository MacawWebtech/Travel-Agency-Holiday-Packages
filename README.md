# Wanderly Holidays – Travel Agency & Holiday Packages HTML Template

A premium, multi-page HTML template for travel agencies selling domestic, international, honeymoon and family holiday packages, with a full traveler dashboard.

**Stack:** HTML5 · Bootstrap 5.3 · Bootstrap Icons · custom CSS (CSS variables) · vanilla ES6+ JavaScript. No jQuery, no build step.

## Quick start

1. Unzip and open `pages/index.html` in a browser, **or** (recommended) serve the folder locally:
   ```bash
   cd wanderly-holidays
   python3 -m http.server 8080   # then visit http://localhost:8080/pages/index.html
   ```
2. Upload the whole folder to any static host (Netlify, Vercel, cPanel, S3). The root `index.html` redirects to `pages/index.html`.

Full guide: open `documentation/index.html`.

## What's included

| Area | Files |
|---|---|
| Public pages (15) | `pages/index.html` (Home – Classic), `index-2.html` (Home – Explorer), `domestic-packages.html`, `international-packages.html`, `honeymoon-family-tours.html`, `package-details.html`, `booking.html`, `about.html`, `blog.html`, `blog-details.html`, `contact.html`, `offers.html`, `login.html`, `404.html`, `coming-soon.html` |
| Traveler dashboard (7) | `pages/dashboard/index.html` (overview), `bookings.html`, `itineraries.html`, `saved.html`, `tickets.html`, `messages.html`, `profile.html` |
| Styles | `assets/css/style.css`, `dark-mode.css`, `rtl.css` |
| Scripts | `assets/js/main.js`, `dashboard.js`, `plugins/packages.js` (package data) |
| SEO | `sitemap.xml`, `robots.txt`, Open Graph tags, JSON-LD (TravelAgency, Product/Offer, FAQPage, BlogPosting) |

## Features

- Single yellow primary color with black/grey neutrals
- Dark (true black) / light mode (follows system preference, saved in `localStorage` as `wanderly-theme`)
- RTL layout toggle for Arabic/Hebrew (saved as `wanderly-dir`)
- Package listings with live filters (region, duration, price, theme, visa, flights) and sorting
- Package details with gallery lightbox, itinerary accordion, pricing by group size and a sticky booking summary
- 5-step booking flow with live price calculation and Stripe/PayPal placeholders
- Saved packages (heart) shared between listings and the dashboard
- Client-side validation with friendly messages and help tooltips
- Skeleton loaders on package grids and dashboard data
- WCAG 2.1 AA focus: skip link, visible focus, ARIA labels, 44px touch targets, reduced-motion support

## Customize in 2 minutes

- **Brand color & fonts:** the whole site uses one primary color, `--wh-primary` (yellow `#f5b800`), with black/grey neutrals. Change it at the top of `assets/css/style.css`. If you pick a darker brand color, also set `--wh-on-primary` to white. Dark mode (true black) lives in `assets/css/dark-mode.css`.
- **Packages:** edit `assets/js/plugins/packages.js`.
- **Currency:** change `money()` in `assets/js/main.js`.
- **Forms:** replace `YOUR_FORM_ID` (Formspree) and the Mailchimp `YOUR_ACCOUNT…` URLs.
- Search the project for `TODO` to find every customization point.

## Important notes

- **Images** load from `picsum.photos` as WebP placeholders. Replace them with your own licensed destination photos (WebP, sized as in the `width`/`height` attributes) before launch. Testimonial portraits load from `randomuser.me` as placeholders; swap them for real customer photos.
- **No real bookings, payments or logins happen.** The booking, login and payment steps are front-end demos and say so on screen. Connect your backend, Stripe or PayPal, and an auth provider (see documentation).
- The JSON-LD ratings and accreditation badges are sample content. Replace them with your real figures and licences.

## Credits

Bootstrap 5.3 (MIT) · Bootstrap Icons (MIT) · Google Fonts: DM Serif Display & DM Sans (OFL) · Placeholder photos: Lorem Picsum / Unsplash.

## Changelog

- **1.2.1** (16 Nov 2026) – Testimonial cards show traveler photos (placeholder portraits from `randomuser.me`; replace with your own customers' photos, with permission) and the last card centers on tablet. Trending carousel scrollbar hidden (arrows, swipe and keyboard still scroll it). Home 2 featured testimonial now uses a Bali coast photo (`assets/images/testimonial-bg.webp`) with a dark gradient overlay instead of a flat black panel.
- **1.2.0** (16 Nov 2026) – Single-color palette: yellow primary, black text on yellow, teal and coral removed, true black dark mode, new logo and OG image.
- **1.1.0** (16 Nov 2026) – Added Home 2 (`index-2.html`): split hero with package/custom-trip search tabs, browse by interest, trending carousel, holidays by budget, domestic vs international panels, expert planner, dashboard preview, FAQ. Home menu is now a dropdown. Listing pages accept `?theme=` and `?region=`.
- **1.0.0** (14 Nov 2026) – Initial release: 14 public pages, 7 dashboard pages, dark mode, RTL, docs.

## Support

Questions or customization requests: support@wanderlyholidays.com (placeholder – replace with your support contact).
