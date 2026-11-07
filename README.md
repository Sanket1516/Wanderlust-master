<div align="center">

# Wanderlust

**An Airbnb-style accommodation marketplace built as a Node.js/Express MVC monolith with server-rendered EJS views.**

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-B4CA65?logo=ejs&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?logo=razorpay&logoColor=white)

<img src="docs/screenshots/01-home.jpg" alt="Wanderlust home page with category bar and listing cards" width="900" />

</div>

## Screenshots

> Real captures of the running app with the seed listings from `init/data.js` and demo users.

### Browse and book

| Listing details | Search ("cabin") |
|:---:|:---:|
| <img src="docs/screenshots/02-listing.jpg" alt="Listing detail page" width="430" /> | <img src="docs/screenshots/03-search.jpg" alt="Search results for cabin" width="430" /> |
| **My bookings** | **Wishlist** |
| <img src="docs/screenshots/07-bookings.jpg" alt="Guest bookings with check-in, check-out and total paid" width="430" /> | <img src="docs/screenshots/06-wishlist.jpg" alt="Saved listings" width="430" /> |
| **Messages inbox** | **Host–guest conversation** |
| <img src="docs/screenshots/08-inbox.jpg" alt="Inbox with unread count" width="430" /> | <img src="docs/screenshots/09-conversation.jpg" alt="Chat between guest and host" width="430" /> |
| **Profile** | **Host a place (with AI description)** |
| <img src="docs/screenshots/10-profile.jpg" alt="User profile with stats and recent bookings" width="430" /> | <img src="docs/screenshots/15-new-listing.jpg" alt="New listing form with Generate with AI" width="430" /> |

### Admin panel

| Dashboard | Listings moderation |
|:---:|:---:|
| <img src="docs/screenshots/11-admin-dashboard.jpg" alt="Admin dashboard with totals and recent bookings" width="430" /> | <img src="docs/screenshots/12-admin-listings.jpg" alt="Admin listings table" width="430" /> |
| **Users** | **Bookings** |
| <img src="docs/screenshots/13-admin-users.jpg" alt="Admin users table" width="430" /> | <img src="docs/screenshots/14-admin-bookings.jpg" alt="Admin bookings table" width="430" /> |

<details>
<summary>More: full listing page (reviews, AI review summary, map), sign-up and mobile</summary>

<p align="center">
<img src="docs/screenshots/02-listing-full.jpg" alt="Full listing page" width="700" /><br/>
<img src="docs/screenshots/04-signup.jpg" alt="Sign-up page" width="700" /><br/>
<img src="docs/screenshots/16-mobile.jpg" alt="Mobile home" width="280" />
</p>

</details>

## Features

- **Listings:** create, edit and delete with Cloudinary image upload; search, filters (price, country, category), sorting and server-side pagination; map coordinates via Mapbox geocoding.
- **Guests:** wishlist, bookings with date validation and cancellation, reviews (duplicate and self-review prevention), host–guest messaging with unread counts.
- **Payments:** Razorpay order creation and payment verification.
- **Admin:** dashboard for analytics and moderation of users, listings and bookings.
- **AI:** generated listing descriptions, review summaries and a listing-aware travel chatbot (Cohere, Groq).
- **Email:** signup, booking, cancellation and message notifications (Nodemailer / Gmail).
- **Auth:** session-based login with Passport Local; Joi validation on inputs.

## Tech stack

Node.js · Express · MongoDB (Atlas) + Mongoose · EJS · Passport · Joi · Multer · Cloudinary · Mapbox · Razorpay · Nodemailer · Cohere · Groq

## Project structure

```
app.js            application entry point
routes/           Express routers
controller/       route logic
models/           Mongoose schemas
middleware.js     auth, validation and other shared middleware
schema.js         Joi validation schemas
views/, layouts/  EJS templates
public/           static CSS and JS
utils/            helpers and service wrappers
init/             seed data
docs/             detailed documentation
```

## Getting started

Requires Node.js and a MongoDB database (Atlas or local).

```bash
git clone https://github.com/Sanket1516/Wanderlust-master.git
cd Wanderlust-master
npm install
cp .env.example .env     # fill in the values below
npm start                # http://localhost:8080
```

Environment variables (see [`.env.example`](.env.example)): `ATLASDB_URL`, `PORT`, `NODE_ENV`, `SESSION_SECRET`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `MAPBOX_TOKEN`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `COHERE_API_KEY`, `COHERE_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`. Never commit your real `.env`.

## Documentation

- [Full technical documentation](docs/FULL_DOCUMENTATION.md): schemas, route map, security, integrations, payment/messaging/review flows, design decisions, HLD and use-case diagrams.
- [Razorpay payment gateway notes](docs/RAZORPAY_PAYMENT_GATEWAY.md)

## Known limitations and next steps

No automated tests, Docker setup, payment webhooks or refund automation yet; messaging is not real-time. Planned: tests, Razorpay webhooks, Socket.IO messaging, rate limiting and CI/CD.

## Author

Sanket Mali · [GitHub](https://github.com/Sanket1516)

## License

ISC, see [LICENSE](LICENSE) (matches `package.json`).
