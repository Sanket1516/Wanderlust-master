# Wanderlust

Wanderlust is a full-stack travel stay booking platform inspired by Airbnb. It allows users to discover properties, create their own listings, save favorites, book stays, pay through Razorpay, review properties, message hosts, manage profiles, and use AI-powered helpers. This README is written as an interview-revision document so that reading it once before an interview should help you explain the project confidently from both product and technical angles.

## Table of Contents

1. Project Summary
2. Elevator Pitch
3. Problem Statement
4. Proposed Solution
5. Core Features
6. Functional Modules
7. User Roles
8. End-to-End User Flows
9. High Level Design
10. Low Level Design Notes
11. System Architecture
12. Database Schema
13. Relationships Between Collections
14. API and Route Map
15. Middleware and Security
16. Third-Party Integrations
17. AI Features
18. Payment Flow
19. Messaging Flow
20. Wishlist Flow
21. Review Flow
22. Admin Flow
23. Validation Strategy
24. Error Handling Strategy
25. Folder Structure
26. Environment Variables
27. Setup and Run
28. Important Technical Decisions
29. Limitations
30. Future Improvements
31. Use Case Diagram
32. HLD Diagram
33. Sequence-Style Flow Summaries
34. Interview Questions and Answers
35. Resume-Friendly Project Description

---

## 1. Project Summary

Wanderlust is an online accommodation marketplace where:

- Guests can browse listings, filter and search them, save them to a wishlist, book them, pay online, review them, and message hosts.
- Hosts can create, edit, and delete their own property listings.
- Admins can moderate users, listings, and bookings from a protected dashboard.
- AI features help generate listing descriptions, summarize reviews, and answer travel-related user questions.

This project is built using Node.js, Express.js, MongoDB, Mongoose, EJS, Passport.js, Cloudinary, Mapbox, Razorpay, Nodemailer, Cohere, and Groq.

---

## 2. Elevator Pitch

Wanderlust is an Airbnb-style booking platform built with the MERN-style backend stack using server-side rendering. The application solves the end-to-end stay-booking journey: listing creation, image upload, location mapping, search and filters, payments, booking management, user reviews, host messaging, admin controls, email notifications, and AI enhancements.

---

## 3. Problem Statement

Traditional hotel or stay-booking platforms need multiple connected capabilities:

- Property discovery
- Search and filtering
- Trust-building through reviews
- Booking and payment handling
- Communication between guest and host
- Admin moderation
- Good UX for saved items, profiles, and booking history

The problem I solved was how to build all of these into one cohesive full-stack platform with authentication, authorization, data validation, third-party service integrations, and secure booking flow.

---

## 4. Proposed Solution

I built Wanderlust as a monolithic Express application using MVC architecture:

- Express handles routing and middleware.
- Mongoose models manage MongoDB collections and relations.
- EJS renders dynamic server-side UI.
- Passport handles authentication and session-based login.
- Cloudinary stores listing images.
- Mapbox geocodes listing locations into coordinates.
- Razorpay handles secure payment processing.
- Nodemailer sends transactional emails.
- Cohere and Groq power AI features.

---

## 5. Core Features

- User signup, login, logout
- Session-based authentication with Passport Local
- Create, read, update, delete listings
- Image upload to Cloudinary using Multer
- Category-based listing classification
- Search across title, location, country, and category
- Filter by price range, country, category
- Sort by price ascending, price descending, newest
- Server-side pagination
- Show listing details with reviews and map coordinates
- Wishlist add/remove toggle
- Booking creation with date validation
- Razorpay order creation and payment verification
- Booking cancellation with access control
- Review creation and deletion
- Duplicate review prevention
- Owner self-review prevention
- User profile with listings and bookings
- Host-guest private messaging
- Inbox with unread message count
- Admin dashboard with analytics and moderation
- Email notifications for signup, bookings, cancellations, and messages
- AI-generated listing descriptions
- AI-generated review summaries
- Travel chatbot with listing-aware responses

---

## 6. Functional Modules

### 6.1 Authentication Module

- Signup using username, email, and password
- Login using Passport local strategy
- Session persistence with `express-session`
- Flash messages for auth feedback
- Redirect-to-original-page after login

### 6.2 Listing Management Module

- Create listing
- Edit listing
- Delete listing
- View all listings
- View single listing
- Search and filter listings

### 6.3 Wishlist Module

- Add listing to wishlist
- Remove listing from wishlist
- Show saved listings
- AJAX and non-AJAX support

### 6.4 Booking Module

- Select check-in and check-out dates
- Validate dates
- Prevent overlapping confirmed bookings
- Create Razorpay order
- Verify Razorpay payment signature
- Save confirmed booking
- Cancel future booking

### 6.5 Review Module

- Add review with rating and comment
- Delete own review
- Block duplicate reviews
- Block self-review by listing owner

### 6.6 Messaging Module

- Start conversation from a listing page
- Send messages inside a conversation
- Inbox view of grouped conversations
- Unread message count
- Mark messages as read on thread open

### 6.7 Admin Module

- Dashboard with counts and revenue
- Manage listings
- Manage users
- Manage bookings
- Promote or demote admin users

### 6.8 AI Module

- Generate listing descriptions
- Summarize reviews
- Provide chatbot assistance using current listing inventory

---

## 7. User Roles

### Guest User

- Browse listings
- Search and filter listings
- View property details
- Cannot create listing, review, wishlist, or book without login

### Authenticated User

- All guest capabilities
- Create and manage own listings
- Save wishlist
- Book listings
- Cancel own bookings
- Add reviews
- Message hosts
- View own profile

### Admin User

- All authenticated user capabilities
- Access admin dashboard
- Delete any listing
- Delete users
- Delete bookings
- Toggle admin role of other users

---

## 8. End-to-End User Flows

### 8.1 Signup and Login Flow

1. User opens signup page.
2. User submits username, email, and password.
3. Server creates a user using `passport-local-mongoose`.
4. User is auto-logged in using `req.login`.
5. Welcome email is sent.
6. User is redirected to `/listings`.

### 8.2 Listing Creation Flow

1. Logged-in user opens `/listings/new`.
2. User submits property details and optional image.
3. Joi validates request body.
4. Multer uploads image to Cloudinary.
5. Mapbox geocodes location into coordinates.
6. Listing is saved with owner id, image metadata, and geometry.
7. User is redirected to listing index.

### 8.3 Booking Flow

1. Logged-in user chooses dates on a listing page.
2. Frontend sends AJAX request to create Razorpay order.
3. Backend validates dates and checks overlap.
4. Backend calculates total nights and total price.
5. Razorpay order is created with booking metadata in `notes`.
6. Frontend opens Razorpay checkout modal.
7. After payment, frontend sends order id, payment id, and signature to backend.
8. Backend verifies HMAC signature.
9. Backend fetches order notes from Razorpay.
10. Backend creates booking in MongoDB.
11. Confirmation emails are sent to guest and host.
12. User is redirected to `/bookings`.

### 8.4 Review Flow

1. Logged-in user submits review on a listing.
2. Joi validates rating and comment.
3. Server checks whether user already reviewed the listing.
4. Server checks whether user is the listing owner.
5. Review is saved and linked to the listing.

### 8.5 Messaging Flow

1. User clicks message host from listing page.
2. Backend generates deterministic `conversationId`.
3. First message is saved.
4. Email notification is sent to receiver.
5. User can continue conversation in thread view.

---

## 9. High Level Design

At high level, the system has these layers:

- Presentation Layer: EJS views, Bootstrap styling, client-side JS
- Application Layer: Express routes, controllers, middleware
- Business Logic Layer: Controller logic for booking, reviews, admin, AI, etc.
- Data Layer: MongoDB with Mongoose schemas and relationships
- External Services Layer: Cloudinary, Mapbox, Razorpay, Gmail, Cohere, Groq

---

## 10. Low Level Design Notes

### MVC Pattern

- `routes/` defines endpoints
- `controller/` contains request-handling logic
- `models/` defines database schemas
- `views/` contains EJS templates
- `middleware.js` centralizes auth, authorization, and Joi validation

### Session Management

- `express-session` stores login state
- Passport serializes user into session
- Passport deserializes user on each request

### Data Integrity

- Joi validates incoming request data
- Mongoose enforces schema constraints
- Authorization middleware protects sensitive actions
- Booking overlap query prevents double booking

---

## 11. System Architecture

```text
Client Browser
   |
   v
Express Server
   |
   +--> Routes
   |      |
   |      v
   |   Controllers
   |      |
   |      +--> Middleware
   |      +--> Mongoose Models
   |      +--> Utility Services
   |
   +--> EJS View Rendering
   |
   +--> MongoDB
   |
   +--> Cloudinary
   +--> Mapbox
   +--> Razorpay
   +--> Gmail/Nodemailer
   +--> Cohere
   +--> Groq
```

---

## 12. Database Schema

The application uses MongoDB with the following main collections:

- `User`
- `listing`
- `Review`
- `Booking`
- `Message`

### 12.1 User Schema

Source: [models/user.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/models/user.js:1)

Fields:

- `email: String` required
- `wishlist: ObjectId[]` references `listing`
- `isAdmin: Boolean` default `false`
- `username, hash, salt` added by `passport-local-mongoose`

Purpose:

- Stores user account details
- Tracks wishlisted listings
- Stores admin privilege flag
- Supports Passport authentication

### 12.2 Listing Schema

Source: [models/listing.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/models/listing.js:1)

Fields:

- `title: String` required
- `description: String` required
- `image.url: String`
- `image.filename: String`
- `price: Number`
- `location: String`
- `country: String` required
- `reviews: ObjectId[]` references `Review`
- `owner: ObjectId` references `User`
- `geometry.type: String` enum `Point`
- `geometry.coordinates: Number[]`
- `category: String` enum of allowed categories

Purpose:

- Stores host-created properties
- Stores geolocation for map support
- Links owner and reviews

Special behavior:

- Post `findOneAndDelete` middleware deletes all linked reviews

### 12.3 Review Schema

Source: [models/review.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/models/review.js:1)

Fields:

- `comment: String` required
- `rating: Number` min 1 max 5
- `createdAt: Date`
- `author: ObjectId` references `User`

Purpose:

- Stores rating and feedback for listings

### 12.4 Booking Schema

Source: [models/booking.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/models/booking.js:1)

Fields:

- `listing: ObjectId` references `listing`
- `guest: ObjectId` references `User`
- `checkIn: Date`
- `checkOut: Date`
- `totalNights: Number`
- `totalPrice: Number`
- `razorpayOrderId: String`
- `razorpayPaymentId: String`
- `status: String` enum `confirmed | cancelled`
- `createdAt: Date`

Purpose:

- Tracks reservation lifecycle
- Stores payment linkage for Razorpay

### 12.5 Message Schema

Source: [models/message.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/models/message.js:1)

Fields:

- `conversationId: String` indexed
- `listing: ObjectId` references `listing`
- `sender: ObjectId` references `User`
- `receiver: ObjectId` references `User`
- `content: String` max length 2000
- `read: Boolean`
- `createdAt: Date`

Purpose:

- Stores private communication between guest and host
- Uses grouped threads via `conversationId`

---

## 13. Relationships Between Collections

```text
User (1) ------< Listing
User (1) ------< Review
User (1) ------< Booking
User (1) ------< Message (sender)
User (1) ------< Message (receiver)

Listing (1) ---< Review
Listing (1) ---< Booking
Listing (1) ---< Message

User (*) ------< wishlist >------ (*) Listing
```

### Relationship Explanation

- One user can own many listings.
- One listing can have many reviews.
- One user can write many reviews.
- One user can make many bookings.
- One listing can have many bookings.
- One user can wishlist many listings.
- One listing can be wishlisted by many users.
- Messages connect sender, receiver, and listing context.

---

## 14. API and Route Map

### Public and User Routes

#### Listing Routes

Source: [routes/listing.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/routes/listing.js:1)

- `GET /listings` list all listings
- `POST /listings` create listing
- `GET /listings/new` render create form
- `GET /listings/search?q=...` search listings
- `GET /listings/:id` show listing
- `PUT /listings/:id` update listing
- `DELETE /listings/:id` delete listing
- `GET /listings/:id/edit` render edit form

#### Review Routes

Source: [routes/reviews.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/routes/reviews.js:1)

- `POST /listings/:id/reviews` create review
- `DELETE /listings/:id/reviews/:reviewId` delete review

#### User Routes

Source: [routes/user.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/routes/user.js:1)

- `GET /signup`
- `POST /signup`
- `GET /login`
- `POST /login`
- `GET /logout`
- `GET /profile`

#### Wishlist Routes

Source: [routes/wishlist.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/routes/wishlist.js:1)

- `GET /wishlist`
- `POST /wishlist/:listingId/toggle`

#### Booking Routes

Source: [routes/booking.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/routes/booking.js:1)

- `GET /bookings`
- `POST /listings/:id/book`
- `POST /bookings/verify`
- `DELETE /bookings/:bookingId`

#### Message Routes

Source: [routes/message.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/routes/message.js:1)

- `GET /messages`
- `POST /messages/start`
- `GET /messages/:conversationId`
- `POST /messages/:conversationId`

#### AI Routes

Source: [routes/ai.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/routes/ai.js:1)

- `POST /ai/listings/description`
- `GET /ai/listings/:id/review-summary`
- `POST /ai/chat`
- `DELETE /ai/chat`

### Admin Routes

Source: [routes/admin.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/routes/admin.js:1)

- `GET /admin`
- `GET /admin/listings`
- `DELETE /admin/listings/:id`
- `GET /admin/users`
- `DELETE /admin/users/:id`
- `POST /admin/users/:id/toggle-admin`
- `GET /admin/bookings`
- `DELETE /admin/bookings/:id`

---

## 15. Middleware and Security

Source: [middleware.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/middleware.js:1)

### Authentication Middleware

- `isLoggedIn`
  - checks `req.isAuthenticated()`
  - saves attempted URL into session
  - redirects to login if not authenticated

### Authorization Middleware

- `isOwner`
  - only listing owner can edit or delete own listing
- `isReviewAuthor`
  - only review author can delete own review
- `isAdmin`
  - only admins can access admin routes

### Validation Middleware

- `validateListing`
  - validates `req.body.listing` using Joi
- `validateReview`
  - validates `req.body.review` using Joi

### Security Decisions

- Session cookies are `httpOnly`
- Secret keys are in `.env`
- Protected routes require authentication
- Role-based admin access is enforced
- Payment verification uses HMAC
- Booking price is computed server-side
- Review and listing permissions are checked on backend

---

## 16. Third-Party Integrations

### Cloudinary

- Used for listing image storage
- Uploaded through Multer + Cloudinary storage engine
- Avoids storing large files inside local server filesystem

### Mapbox

- Used for location geocoding
- Converts human-readable location into `geometry.coordinates`
- Helps render listing location on map

### Razorpay

- Used for online booking payments
- Backend creates order
- Frontend opens payment modal
- Backend verifies payment signature

### Nodemailer with Gmail

- Sends welcome email
- Sends booking confirmation email
- Sends booking alert to host
- Sends booking cancellation email
- Sends message notifications

### Cohere

- Generates AI listing descriptions
- Generates review summaries

### Groq

- Powers conversational travel chatbot
- Uses a system prompt plus current listing data

---

## 17. AI Features

Source: [controller/ai.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/controller/ai.js:1)

### 17.1 Listing Description Generator

Input:

- title
- location
- country
- category
- price

Output:

- one polished listing description in plain text

Why useful:

- helps host write professional content faster

### 17.2 Review Summary Generator

Input:

- existing reviews on a listing

Output:

- concise summary
- highlights
- watch-outs
- average rating metadata

Why useful:

- gives new users a quick trust snapshot

### 17.3 Travel Chatbot

Behavior:

- stores limited chat history in session
- injects current listing inventory into system prompt
- gives listing-aware travel recommendations
- avoids inventing unavailable listings

---

## 18. Payment Flow

Source: [controller/booking.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/controller/booking.js:1)

### Why Razorpay Was Used

- better India-focused payment methods
- smooth in-page modal
- supports UPI, cards, wallets, net banking

### Booking Validation Logic

- listing must exist
- check-in cannot be in the past
- check-out must be after check-in
- overlapping confirmed bookings are blocked

### Overlap Query Logic

```js
{
  listing: listing._id,
  status: "confirmed",
  checkIn: { $lt: checkOutDate },
  checkOut: { $gt: checkInDate }
}
```

Meaning:

- if an existing booking starts before the requested checkout
- and ends after the requested check-in
- then the date ranges overlap

### Payment Verification Logic

- backend recalculates expected signature using `crypto.createHmac`
- compares it to `razorpay_signature`
- only then creates booking

### Why This Is Secure

- prevents fake successful payment requests
- does not trust frontend price or booking metadata
- fetches booking data from Razorpay order notes

---

## 19. Messaging Flow

Source: [controller/message.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/controller/message.js:1)

### How Conversations Work

- A unique `conversationId` is generated from:
  - listing id
  - two user ids sorted deterministically

Example idea:

```text
listingId_userA_userB
```

This prevents duplicate parallel conversation threads for the same listing-user pair.

### Messaging Features

- inbox groups messages by latest conversation
- unread count is tracked
- thread marks unread received messages as read
- email is sent when a new message is received

---

## 20. Wishlist Flow

Source: [controller/wishlist.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/controller/wishlist.js:1)

### Logic

- if listing not in wishlist, add it
- if already in wishlist, remove it

### Why a Toggle Endpoint Is Good

- simpler frontend integration
- one route handles save and unsave
- works with both AJAX and standard form submit

### Data Storage

- user document stores `wishlist` array of listing ids

---

## 21. Review Flow

Source: [controller/reviews.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/controller/reviews.js:1)

### Business Rules

- user must be logged in
- review input must pass Joi validation
- one user can review a listing only once
- listing owner cannot review own property
- only review author can delete own review

### Why These Rules Matter

- keeps ratings fair
- prevents spam
- prevents fake self-promotion

---

## 22. Admin Flow

Source: [controller/admin.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/controller/admin.js:1)

### Dashboard Metrics

- total listings
- total users
- total bookings
- total revenue
- recent bookings

### Admin Privileges

- view all listings
- delete any listing
- view all users
- delete users except self
- toggle admin role for others
- view all bookings
- delete any booking

### Important Guard Conditions

- admin cannot delete own account
- admin cannot demote self

---

## 23. Validation Strategy

Source: [schema.js](/C:/Users/sanke/Downloads/Wanderlust-master/Wanderlust-master/schema.js:1)

### Listing Validation

- title required
- description required
- location required
- country required
- image optional
- price non-negative
- category must belong to fixed enum

### Review Validation

- comment required
- rating required between 1 and 5

### Why Validation Exists at Joi Layer

- rejects malformed request before DB operation
- keeps controller logic cleaner
- reduces bad payload risk

---

## 24. Error Handling Strategy

### Techniques Used

- async routes wrapped using `wrapAsync`
- custom `ExpressError` object
- global error middleware in `app.js`
- flash messages for user-friendly feedback

### Benefits

- avoids repetitive try/catch in every route
- centralizes error rendering
- improves debuggability and UX

---

## 25. Folder Structure

```text
controller/   Business logic for routes
docs/         Additional technical documentation
Extra/        Extra notes
init/         Seed data and initialization scripts
layouts/      Shared EJS layout
models/       Mongoose schemas
public/       Static CSS and JS
routes/       Express routers
uploads/      Upload-related local storage area
utils/        Helpers and service wrappers
views/        EJS templates
app.js        Application entry point
middleware.js Shared middleware
schema.js     Joi validation schemas
cloudConfig.js Cloudinary configuration
```

---

## 26. Environment Variables

Source: [.env.example](../.env.example)

### Required Variables

```env
ATLASDB_URL=
PORT=
NODE_ENV=
SESSION_SECRET=
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=
MAPBOX_TOKEN=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
COHERE_API_KEY=
COHERE_MODEL=
GROQ_API_KEY=
GROQ_MODEL=
```

### Why Each Matters

- `ATLASDB_URL` MongoDB connection
- `SESSION_SECRET` signs session data
- `CLOUD_*` Cloudinary image hosting
- `MAPBOX_TOKEN` geocoding and map support
- `RAZORPAY_*` payment integration
- `GMAIL_*` transactional email notifications
- `COHERE_*` AI generation
- `GROQ_*` chatbot functionality

---

## 27. Setup and Run

### Installation

```bash
npm install
```

### Run

```bash
npm start
```

### Default Local URL

```text
http://localhost:8080
```

### Seed or Initialization

There is an `init/` folder which contains seed-related files and starter data.

---

## 28. Important Technical Decisions

### Why Server-Side Rendering with EJS

- simpler full-stack integration for forms and flash messages
- fast to build multi-page workflows
- good for learning complete Express lifecycle

### Why MongoDB

- flexible schema for listings, reviews, bookings, and messages
- easy relation modeling with Mongoose refs

### Why Passport Local

- quick local auth integration
- `passport-local-mongoose` reduces boilerplate for password hashing and auth methods

### Why Monolithic Architecture

- easier to build, test, and reason about for a major project
- all modules live in one deployable app

---

## 29. Limitations

- no automated test suite yet
- no Docker configuration
- no webhook-based payment reconciliation yet
- no refund automation
- no real-time socket messaging
- no image deletion cleanup from Cloudinary on update/delete
- no advanced analytics or recommendation engine

---

## 30. Future Improvements

- add unit and integration tests
- add Razorpay webhooks
- add refund support on cancellation
- add real-time messaging with Socket.IO
- add booking calendar blocking on UI
- add stronger input sanitization and rate limiting
- add soft delete and audit logs for admin actions
- add separate host dashboard
- add payment history and invoices
- add CI/CD pipeline

---

## 31. Use Case Diagram

```text
Actors:
  Guest
  Authenticated User
  Admin
  External Services

Guest:
  - Browse listings
  - Search listings
  - Filter listings
  - View listing details
  - Sign up
  - Log in

Authenticated User:
  - Create listing
  - Edit own listing
  - Delete own listing
  - Add to wishlist
  - Remove from wishlist
  - Book listing
  - Cancel booking
  - Review listing
  - Delete own review
  - Message host
  - View inbox
  - View profile
  - Use AI description and chatbot

Admin:
  - View dashboard
  - Delete any listing
  - Delete users
  - Delete bookings
  - Toggle admin role

External Services:
  - Cloudinary stores images
  - Mapbox geocodes location
  - Razorpay processes payment
  - Gmail sends emails
  - Cohere generates text
  - Groq powers chatbot
```

---

## 32. HLD Diagram

```text
                    +----------------------+
                    |      End Users       |
                    | Guest / User / Admin |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |   Browser + EJS UI   |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |   Express App        |
                    |  app.js              |
                    +----------+-----------+
                               |
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
+-------------+        +---------------+       +---------------+
| Middleware  |        | Route Layer   |       | View Layer    |
| Auth/ACL    |        | listing/user  |       | EJS templates |
| Validation  |        | booking/admin |       | flash/layouts |
+------+------+        +-------+-------+       +-------+-------+
       |                       |                       |
       +-----------------------+-----------------------+
                               |
                               v
                    +----------------------+
                    |   Controllers        |
                    | Business Logic       |
                    +----------+-----------+
                               |
       +-----------------------+------------------------------+
       |                       |                              |
       v                       v                              v
+-------------+       +---------------+             +----------------+
| Mongoose    |       | Utility Layer |             | External APIs  |
| Models      |       | mailer/ai     |             | Cloudinary     |
| User        |       | templates     |             | Mapbox         |
| Listing     |       | groq/cohere   |             | Razorpay       |
| Booking     |       | wrapAsync     |             | Gmail          |
| Review      |       +---------------+             | Cohere/Groq    |
| Message     |                                     +----------------+
+------+------+ 
       |
       v
+-------------+
| MongoDB     |
+-------------+
```

---

## 33. Sequence-Style Flow Summaries

### 33.1 Create Listing

```text
User -> Listing Form -> Express Route -> Joi Validation -> Cloudinary Upload
-> Mapbox Geocode -> Mongoose Save -> Redirect -> Listing Visible
```

### 33.2 Book Listing

```text
User -> Choose Dates -> AJAX /listings/:id/book -> Validate Dates
-> Overlap Check -> Razorpay Order -> Payment Modal -> /bookings/verify
-> HMAC Verification -> Save Booking -> Send Emails -> Redirect /bookings
```

### 33.3 Add Review

```text
User -> Review Form -> Joi Validation -> Duplicate Review Check
-> Owner Check -> Save Review -> Push Review ID to Listing -> Redirect
```

### 33.4 Message Host

```text
User -> Start Conversation -> Build conversationId -> Save Message
-> Send Email Notification -> Open Thread -> Continue Messaging
```

---

## 34. Interview Questions and Answers

This section is the most important for revision.

### 34.1 Basic Project Questions

#### Q1. What is your project?

Wanderlust is an Airbnb-style travel accommodation booking platform where users can discover properties, create their own listings, wishlist stays, book them using Razorpay, review experiences, message hosts, and use AI-powered helpers.

#### Q2. What problem does it solve?

It solves the full booking journey in one platform: discovery, trust, booking, payment, communication, and moderation.

#### Q3. What is the tech stack?

Node.js, Express.js, MongoDB, Mongoose, EJS, Passport.js, Cloudinary, Mapbox, Razorpay, Nodemailer, Cohere, and Groq.

#### Q4. Why did you choose EJS instead of React?

Because this project is strongly form-driven and route-driven, EJS made server-side rendering, flash messages, session auth, and multi-page workflows simpler and faster to implement in a full-stack Express architecture.

### 34.2 Architecture Questions

#### Q5. Which architecture did you use?

I used MVC architecture inside a monolithic Express application.

#### Q6. What is the role of controllers?

Controllers contain business logic. Routes delegate request handling to controllers, which keeps route files cleaner and separates concerns.

#### Q7. Why use middleware?

Middleware centralizes repeated logic like authentication checks, authorization, redirect preservation, and Joi validation.

### 34.3 Database Questions

#### Q8. Which database did you use and why?

MongoDB because the project has document-oriented data like listings, reviews, bookings, and messages, and Mongoose made schema definition and reference handling straightforward.

#### Q9. What collections are used?

User, listing, Review, Booking, and Message.

#### Q10. What relationships exist?

- User to Listing is one-to-many
- Listing to Review is one-to-many
- User to Review is one-to-many
- User to Booking is one-to-many
- Listing to Booking is one-to-many
- User to Listing through wishlist is many-to-many
- User to Message is one-to-many as sender and receiver

#### Q11. How did you implement wishlist?

I stored an array of listing ObjectIds inside the user document and used a toggle endpoint to add or remove listing ids.

### 34.4 Authentication Questions

#### Q12. How is authentication implemented?

Using Passport Local Strategy with `passport-local-mongoose`, sessions via `express-session`, and Passport serialization/deserialization.

#### Q13. How do you protect routes?

Using `isLoggedIn`, `isOwner`, `isReviewAuthor`, and `isAdmin` middleware.

#### Q14. How do you redirect users back after login?

I store `req.originalUrl` in `req.session.redirectUrl`, then move it to `res.locals.redirectUrl` after successful authentication and redirect there.

### 34.5 Listing Questions

#### Q15. How does listing creation work?

The user submits listing details, Joi validates them, Multer uploads the image to Cloudinary, Mapbox geocodes the location, and then the listing is saved with owner, image metadata, and geometry.

#### Q16. Why did you use Cloudinary?

Because storing user-uploaded media on a dedicated cloud media service is more scalable and production-friendly than saving raw files locally.

#### Q17. Why did you geocode locations?

To convert a text location into latitude-longitude coordinates so the property can be shown accurately on a map.

### 34.6 Booking and Payment Questions

#### Q18. How do you prevent double booking?

Before creating a payment order, I query confirmed bookings for the same listing and check if the requested date range overlaps.

#### Q19. How do you calculate total booking amount?

On the server side using total nights multiplied by listing price. I do not trust the client for price calculation.

#### Q20. Why is server-side price calculation important?

Because client-side values can be modified by users. Server-side calculation prevents price tampering.

#### Q21. How is payment verified?

After payment success, the backend verifies the Razorpay signature using HMAC SHA256 with the secret key.

#### Q22. Why save `razorpayOrderId`?

It helps prevent duplicate booking creation if payment verification endpoint gets called twice.

#### Q23. Why fetch order notes from Razorpay again?

Because it avoids trusting potentially tampered frontend payload and gives me the original booking metadata that my server attached during order creation.

### 34.7 Review Questions

#### Q24. How do you prevent fake reviews?

I block duplicate reviews by the same user on the same listing and also block owners from reviewing their own listing.

#### Q25. How are reviews linked to listings?

Each review is saved in the Review collection and its ObjectId is pushed into the listing's `reviews` array.

### 34.8 Messaging Questions

#### Q26. How did you model messaging?

I stored each message as a document and grouped conversations using a deterministic `conversationId` built from listing id and two user ids.

#### Q27. Why use deterministic conversation ids?

To ensure the same two users talking about the same listing land in one thread instead of creating duplicates.

### 34.9 Admin Questions

#### Q28. What can admins do?

Admins can access platform stats, moderate listings, manage users, manage bookings, and toggle admin status for other users.

#### Q29. What safety checks exist in admin panel?

Admins cannot delete their own account or demote themselves.

### 34.10 AI Questions

#### Q30. What AI features did you add?

AI listing description generation, AI review summarization, and a listing-aware travel chatbot.

#### Q31. How is your chatbot grounded in project data?

It loads current listings from the database, formats them into the system prompt, and instructs the model not to invent unavailable listings.

#### Q32. Which APIs did you use for AI?

Cohere for text generation and Groq for chatbot completions.

### 34.11 Validation and Security Questions

#### Q33. Why use Joi when Mongoose already validates?

Joi validates request payloads before they even reach business logic or database operations. It gives cleaner request-level validation and user-friendly early rejection.

#### Q34. What security measures did you implement?

- session-based auth
- httpOnly cookies
- env-based secret storage
- route protection middleware
- backend authorization checks
- payment signature verification
- server-side price and date validation

#### Q35. How do you handle errors?

Async handlers are wrapped with `wrapAsync`, custom errors can be thrown with `ExpressError`, and all errors are finally handled by a global Express error middleware.

### 34.12 Performance and Scalability Questions

#### Q36. Did you implement pagination?

Yes, the listing index uses server-side pagination with `skip` and `limit`.

#### Q37. Why server-side pagination?

It reduces the number of documents fetched at once, improves performance, and is more scalable than loading everything on the client.

#### Q38. Did you optimize any repeated UI data?

Yes, unread message count and wishlist count are computed for navbar display, and the chatbot also caches listing inventory for a short TTL to reduce repeated database reads.

### 34.13 Improvement Questions

#### Q39. What would you improve if given more time?

I would add automated tests, payment webhooks, refund support, real-time chat, stronger rate limiting, and a cleaner microservice-ready boundary for payments and messaging.

#### Q40. What was the most challenging part?

The booking and payment flow because it required date validation, double-booking prevention, secure order creation, payment signature verification, and transactional follow-up emails.

---

## 35. Resume-Friendly Project Description

Built a full-stack Airbnb-style accommodation booking platform using Node.js, Express.js, MongoDB, Mongoose, and EJS with features such as authentication, listing CRUD, Cloudinary image upload, Mapbox geolocation, Razorpay payment integration, booking management, wishlist, reviews, private host messaging, admin dashboard, email notifications, and AI-powered description generation, review summarization, and chatbot support.

---

## Quick Revision Sheet

If you have only two minutes before an interview, revise these points:

- Wanderlust is an Airbnb-style full-stack booking platform.
- Stack: Node.js, Express, MongoDB, Mongoose, EJS, Passport, Cloudinary, Mapbox, Razorpay, Nodemailer, Cohere, Groq.
- Architecture: MVC monolith with server-side rendering.
- Main collections: User, listing, Review, Booking, Message.
- Key features: listing CRUD, auth, wishlist, booking, payments, reviews, messaging, admin, AI.
- Security: Joi validation, Passport auth, role checks, ownership checks, HMAC payment verification, server-side price calculation.
- Double booking prevention uses overlap query on confirmed bookings.
- Wishlist is stored in user document as listing ObjectId array.
- Reviews are blocked for duplicates and self-review by owners.
- Messaging uses deterministic `conversationId`.
- Admin gets dashboard metrics and moderation controls.

---

## Final Interview Closing Line

If asked to summarize the project in one line, you can say:

"Wanderlust is a secure, full-stack Airbnb-style booking platform that I built to handle the complete accommodation lifecycle from discovery to payment, communication, moderation, and AI-assisted user experience."
