# Wanderlust

Wanderlust is a full-stack travel stay booking platform inspired by Airbnb. Users can explore listings, save favorites, book stays, leave reviews, message each other, and use AI-powered helpers for travel guidance and listing content.

## Highlights

- Discover listings with category filters, pricing, images, and location details
- Create, edit, and manage property listings
- Save favorite places to a personal wishlist
- Book stays with Razorpay payment integration
- Leave ratings and reviews on listings
- Chat with hosts through the built-in messaging system
- Use AI features for listing descriptions, review summaries, and a travel chatbot
- Manage users, listings, and bookings from an admin dashboard

## Tech Stack

- Backend: Node.js, Express 5, Mongoose, Passport.js
- Frontend: EJS, EJS-Mate, Bootstrap, vanilla JavaScript
- Database: MongoDB
- Services: Cloudinary, Mapbox, Razorpay, Nodemailer, Groq, Cohere

## Project Structure

```text
controller/   Route controllers and business logic
models/       Mongoose schemas
routes/       Express route definitions
views/        EJS templates
public/       Static CSS and JavaScript
utils/        Shared helpers, AI integrations, mailer
init/         Seed/init scripts
docs/         Extra project documentation
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

Create a `.env` file in the project root and add the values you need:

```env
ATLASDB_URL=mongodb://127.0.0.1:27017/vanderlust
PORT=8080
SESSION_SECRET=your_session_secret

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

MAPBOX_TOKEN=your_mapbox_token

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

COHERE_API_KEY=your_cohere_api_key
COHERE_MODEL=command-a-03-2025
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Start MongoDB

Use either:

- A local MongoDB server on `127.0.0.1:27017`
- A MongoDB Atlas connection string in `ATLASDB_URL`

### 4. Run the app

```bash
npm start
```

Open [http://localhost:8080](http://localhost:8080).

## Optional Seed Data

If you want to populate sample listings:

```bash
node init/index.js
```

## Core Features

### Authentication

- User signup and login with Passport local strategy
- Session-based authentication
- Protected routes for logged-in users and admins

### Listings

- Create, update, view, and delete property listings
- Upload listing images with Cloudinary
- Show listing location on Mapbox

### Bookings and Payments

- Create and manage bookings
- Razorpay checkout flow
- Booking history for users

### Reviews and Wishlist

- Add ratings and comments to listings
- Save and remove wishlist items

### Messaging

- Inbox and conversation flows between users

### AI

- Generate listing descriptions
- Summarize listing reviews
- Travel chatbot powered by Groq

## Troubleshooting

- `Chat is currently unavailable`
  Make sure `GROQ_API_KEY` is present, valid, and the server has been restarted after editing `.env`.

- Images are not uploading
  Verify `CLOUD_NAME`, `CLOUD_API_KEY`, and `CLOUD_API_SECRET`.

- Maps are missing
  Check that `MAPBOX_TOKEN` is set correctly.

- Payments fail
  Confirm your Razorpay test keys are valid.

- Database connection error
  Recheck `ATLASDB_URL` and make sure MongoDB is running or reachable.

## Security Notes

- Never commit `.env`
- Use a strong `SESSION_SECRET`
- Rotate third-party API keys if they are exposed

## Author

Built by Sanket Mali.
