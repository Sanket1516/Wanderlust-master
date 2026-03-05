# Wanderlust

> A full-stack Airbnb-inspired property rental platform built with Node.js, Express, MongoDB, and Bootstrap.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Routes & API Endpoints](#routes--api-endpoints)
- [Database Models](#database-models)
- [Authentication & Authorization](#authentication--authorization)
- [Image Upload](#image-upload)
- [Maps & Geocoding](#maps--geocoding)
- [Category System](#category-system)
- [Validation & Error Handling](#validation--error-handling)
- [Frontend & UI](#frontend--ui)

---

## Overview

**Wanderlust** is a full-featured property rental web application inspired by Airbnb. Users can browse thousands of travel listings across the globe — from mountain cabins to ocean cruises. Registered users can list their own properties, leave reviews with star ratings, and interact with an interactive map for every listing.

The application is built using the **MVC (Model-View-Controller)** architectural pattern for clean separation of concerns and maintainability.

---

## Features

### Public (No Login Required)
- Browse all available listings in a responsive grid layout
- Filter listings by category (Mountains, City, Castles, Pools, Farms, and more)
- Search listings by title, location, or country
- View detailed information for any listing including price, description, and location
- View all user reviews and star ratings for each listing
- Interactive Mapbox map showing the exact property location
- Tax toggle to display price with 18% GST included

### Authenticated Users
- Sign up and log in securely
- Create new property listings with image upload, geocoding, and category
- AI-assisted listing description generation (Gemini)
- Edit or delete your own listings
- Leave star-rated reviews with comments on any listing
- Delete your own reviews
- AI-generated review summary on listing detail pages
- Automatic redirect back to intended page after login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5.1.0 |
| Database | MongoDB (local) |
| ODM | Mongoose v8.16.2 |
| Templating | EJS v3.1.10 + EJS-Mate v4.0.0 |
| CSS Framework | Bootstrap 5.3.7 |
| Icons | Font Awesome 6.7.2 |
| Authentication | Passport.js v0.7.0 + Passport-Local |
| Sessions | Express-Session v1.18.2 |
| Validation | Joi v17.13.3 |
| File Upload | Multer v2.0.2 |
| Cloud Storage | Cloudinary v1.41.3 |
| Maps | Mapbox GL JS v3.15.0 + Mapbox SDK v0.16.2 |
| Forms | Method-Override v3.0.0 |
| Flash Messages | Connect-Flash v0.1.1 |
| Environment | Dotenv v17.2.2 |

---

## Project Structure

```
Wanderlust-master/
│
├── app.js                    # Entry point — Express app setup, middleware, routes
├── cloudConfig.js            # Cloudinary storage configuration
├── middleware.js             # Custom middleware (auth, validation, authorization)
├── schema.js                 # Joi validation schemas
│
├── models/                   # Mongoose data models
│   ├── listing.js            # Property listing schema
│   ├── review.js             # User review schema
│   └── user.js               # User account schema
│
├── routes/                   # Express route definitions
│   ├── listing.js            # Listing CRUD routes
│   ├── reviews.js            # Review routes
│   └── user.js               # Auth routes (signup/login/logout)
│
├── controller/               # Business logic handlers
│   ├── listings.js           # Listing controller
│   ├── reviews.js            # Review controller
│   └── users.js              # User controller
│
├── views/                    # EJS templates
│   ├── listings/
│   │   ├── index.ejs         # All listings (home page)
│   │   ├── show.ejs          # Single listing detail
│   │   ├── newlisting.ejs    # Create listing form
│   │   └── edit.ejs          # Edit listing form
│   ├── users/
│   │   ├── signup.ejs        # Registration form
│   │   └── login.ejs         # Login form
│   ├── includes/
│   │   ├── navbar.ejs        # Navigation bar
│   │   ├── footer.ejs        # Footer
│   │   └── flash.ejs         # Flash messages
│   └── errors/
│       └── error.ejs         # Error display page
│
├── layouts/
│   └── boilerplate.ejs       # Main HTML layout wrapper
│
├── public/                   # Static assets
│   ├── css/
│   │   ├── style.css         # Global styles
│   │   └── rating.css        # Star rating component
│   └── js/
│       ├── map.js            # Mapbox map initialization
│       └── formvalidation.js # Bootstrap form client-side validation
│
├── utils/                    # Utility helpers
│   ├── wrapAsync.js          # Async error handler wrapper
│   └── ExpressError.js       # Custom HTTP error class
│
├── init/                     # Database seed scripts
├── uploads/                  # Local upload temp directory
└── .env                      # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed and available:

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally on port `27017`)
- A [Cloudinary](https://cloudinary.com/) account (for image hosting)
- A [Mapbox](https://www.mapbox.com/) account (for maps and geocoding)

---

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/wanderlust.git

# 2. Navigate into the project directory
cd Wanderlust-master

# 3. Install all dependencies
npm install
```

---

### Environment Variables

Create a `.env` file in the root of the project with the following keys:

```env
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
MAPBOX_TOKEN=your_mapbox_public_token
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-1.5-flash
```

| Variable | Description |
|---|---|
| `CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUD_API_KEY` | Your Cloudinary API key |
| `CLOUD_API_SECRET` | Your Cloudinary API secret |
| `MAPBOX_TOKEN` | Your Mapbox public access token |
| `GEMINI_API_KEY` | Google AI Studio API key used for AI description + review summary |
| `GEMINI_MODEL` | Optional Gemini model override (default: `gemini-1.5-flash`) |

> **Note:** Never commit your `.env` file to version control.

---

### Running the App

```bash
# Make sure MongoDB is running locally first, then:
node app.js
```

The application will start on **http://localhost:8080**

---

## Routes & API Endpoints

### Listing Routes — `/listings`

| Method | Path | Description | Auth Required |
|---|---|---|---|
| GET | `/listings` | View all listings (home page) | No |
| GET | `/listings/new` | Show create listing form | Yes |
| POST | `/listings` | Submit new listing | Yes |
| GET | `/listings/search` | Search listings by query | No |
| GET | `/listings/:id` | View listing detail | No |
| GET | `/listings/:id/edit` | Show edit form | Yes + Owner |
| PUT | `/listings/:id` | Update listing | Yes + Owner |
| DELETE | `/listings/:id` | Delete listing | Yes + Owner |

### Review Routes — `/listings/:id/reviews`

| Method | Path | Description | Auth Required |
|---|---|---|---|
| POST | `/listings/:id/reviews` | Submit a new review | Yes |
| DELETE | `/listings/:id/reviews/:reviewId` | Delete a review | Yes + Author |

### User Routes

| Method | Path | Description |
|---|---|---|
| GET | `/signup` | Show registration form |
| POST | `/signup` | Register a new user |
| GET | `/login` | Show login form |
| POST | `/login` | Authenticate user |
| GET | `/logout` | Log out current user |

### AI Routes

| Method | Path | Description | Auth Required |
|---|---|---|---|
| POST | `/ai/listings/description` | Generate listing description suggestion from form fields | Yes |
| GET | `/ai/listings/:id/review-summary` | Generate AI summary from listing reviews | No |

---

## Database Models

### Listing

```js
{
  title:       String   (required),
  description: String   (required),
  image: {
    url:       String,
    filename:  String
  },
  price:       Number,
  location:    String,
  country:     String   (required),
  category:    Enum     (required) — one of:
               ["Rooms", "Mountains", "City", "Castles",
                "Pools", "Camp", "Cabin", "Nature",
                "Farm", "Boat", "Cruise"],
  reviews:     [ObjectId]  → ref: Review,
  owner:       ObjectId    → ref: User  (required),
  geometry: {
    type:        "Point",
    coordinates: [Number, Number]   // [longitude, latitude]
  }
}
```

> **Cascade Delete:** When a listing is deleted, all associated reviews are automatically removed via a Mongoose post-hook.

---

### Review

```js
{
  comment:   String   (required),
  rating:    Number   (min: 1, max: 5),
  createdAt: Date     (default: now),
  author:    ObjectId → ref: User
}
```

---

### User

```js
{
  email:    String  (required, unique),
  username: String  (managed by passport-local-mongoose),
  // password, salt, hash managed securely by passport-local-mongoose
}
```

---

## Authentication & Authorization

Wanderlust uses **Passport.js** with the **Local Strategy** for username/password authentication.

### How It Works

1. Passwords are **never stored in plaintext** — `passport-local-mongoose` handles hashing with salt automatically.
2. Sessions are maintained using **Express-Session** with a 7-day cookie lifespan.
3. Cookies are set with `httpOnly: true` to prevent XSS-based session theft.

### Middleware

| Middleware | Purpose |
|---|---|
| `isLoggedIn` | Blocks access and redirects unauthenticated users to `/login` |
| `saveRedirectUrl` | Stores the requested URL in session for post-login redirect |
| `isOwner` | Verifies the logged-in user owns the listing (for edit/delete) |
| `isReviewAuthor` | Verifies the logged-in user authored the review (for delete) |

### Session Config

```js
{
  secret: "...",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}
```

---

## Image Upload

Images are uploaded using **Multer** and stored on **Cloudinary**.

- Upload format support: `jpeg`, `png`, `jpg`
- Files are stored under the `Wanderlust` folder in the configured Cloudinary cloud
- Cloudinary returns a public URL which is saved in the listing's `image.url` field
- On the edit page, a thumbnail preview of the current image is shown (resized to 250px via Cloudinary transformation)

---

## Maps & Geocoding

Every listing has an interactive **Mapbox** map on its detail page.

### Geocoding Flow

1. When a listing is created, the `location` and `country` fields are forwarded to the **Mapbox Geocoding API**.
2. The API returns a GeoJSON feature with coordinates.
3. The coordinates are stored in `geometry.coordinates` as a GeoJSON Point.

### Map Display

- Mapbox GL JS renders a map centered on the listing's coordinates.
- A red marker is placed at the exact property location.
- Default zoom level: `9`

---

## Category System

Listings can be assigned one of **11 categories**, displayed as filterable icon tabs on the home page:

| Category | Icon |
|---|---|
| Trending | Trending icon |
| Rooms | Bed icon |
| City | Building icon |
| Mountains | Mountain icon |
| Castles | Fort icon |
| Pools | Swimming icon |
| Camp | Campground icon |
| Cabin | Snowflake icon |
| Nature | Tree icon |
| Farm | Cow icon |
| Boat | Sailboat icon |
| Cruise | Ship icon |

Clicking a category button dynamically filters the listing grid using **client-side JavaScript** — no page reload required.

---

## Validation & Error Handling

### Server-Side Validation

All user-submitted data is validated using **Joi** schemas defined in `schema.js`:

- `listingSchema` — validates title, description, location, country, price, category, and image
- `reviewSchema` — validates comment (required) and rating (1–5)

Validation errors are caught by middleware and returned as meaningful error messages.

### Error Handling Chain

```
User submits form
      ↓
Joi schema validation (middleware)
      ↓
Controller logic (wrapped in wrapAsync)
      ↓
Global error handler → renders errors/error.ejs
```

- `wrapAsync(fn)` — wraps async route handlers and forwards errors to Express's next()
- `ExpressError(statusCode, message)` — custom error class for controlled HTTP errors

### Flash Messages

- **Success** messages are shown after creating, editing, or deleting listings
- **Error** messages are shown for auth failures, authorization issues, or validation errors

---

## Frontend & UI

### Layout

- All pages use a shared **boilerplate layout** (`layouts/boilerplate.ejs`) with consistent navbar and footer
- Fully responsive using Bootstrap 5 grid system

### Navbar

- Brand logo with compass icon (color: `#fe424d`)
- Navigation links: Airbnb your home, Wishlist, Sign Up / Login
- Dynamically shows **Logout** when user is logged in

### Home Page

- Scrollable category filter bar at the top
- **Tax toggle** switch to display prices with 18% GST (`₹ price + 18%`)
- Listing cards with image, title, location, and price per night

### Listing Detail Page

- Full listing image
- Title, description, price, location, country, and owner name
- **Mapbox interactive map** centered on the property
- Review section: shows all reviews with star rating, comment, and author
- Review form for authenticated users (star rating + comment)

### Form Pages

- Create and Edit listing forms with Bootstrap validation
- Client-side validation using `formvalidation.js` to prevent empty submissions
- Image upload input with optional current image thumbnail on edit

### Pricing

- Prices displayed in **Indian Rupees (₹)** using `.toLocaleString("en-IN")`
- 18% GST calculated and toggled via a switch on the listings page

---

## License

This project is open-source and free to use for educational purposes.

---

*Built with love for travelers everywhere.*
