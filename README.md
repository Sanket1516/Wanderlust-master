<div align="center">
  <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop" alt="Wanderlust Header" width="100%" style="border-radius: 12px; margin-bottom: 20px;">
# Wanderlust

  # 🌍 Wanderlust - The Ultimate Travel Booking Platform
Wanderlust is a full-stack travel stay booking platform inspired by Airbnb. Users can explore listings, save favorites, book stays, leave reviews, message each other, and use AI-powered helpers for travel guidance and listing content.

  **A modern, feature-rich, highly scalable web application for discovering, reviewing, and booking your absolute dream vacation destinations.**
## Highlights

  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)]()
  [![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)]()
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)]()
  [![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white)]()
  [![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=white)]()
  [![PassportJS](https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=white)]()
  [![EJS](https://img.shields.io/badge/EJS-B4CA65?style=for-the-badge&logo=ejs&logoColor=black)]()
  [![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)]()
  [![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)]()
</div>
- Discover listings with category filters, pricing, images, and location details
- Create, edit, and manage property listings
- Save favorite places to a personal wishlist
- Book stays with Razorpay payment integration
- Leave ratings and reviews on listings
- Chat with hosts through the built-in messaging system
- Use AI features for listing descriptions, review summaries, and a travel chatbot
- Manage users, listings, and bookings from an admin dashboard

---
## Tech Stack

## 📑 Table of Contents
  - [📖 Project Overview](#-project-overview)
  - [✨ Comprehensive Feature Breakdown](#sparkles-comprehensive-feature-breakdown)
    - [🏨 Core Listing & Property Management](#-core-listing--property-management)
    - [📍 Interactive Maps & Geolocation](#-interactive-maps--geolocation)
    - [💳 Complete Booking & Payment Architecture](#-complete-booking--payment-architecture)
    - [👥 User Engagement & Profiles](#-user-engagement--profiles)
    - [🤖 Smart Functionalities](#-smart-functionalities)
    - [🛡️ Administration & Security Panel](#️-administration--security-panel)
    - [🔒 Backend Safety & Integrity Protocols](#-backend-safety--integrity-protocols)
  - [📸 Application Screenshots](#camera_flash-application-screenshots)
  - [🎨 Architecture & System Flow](#art-architecture--system-flow)
  - [🚀 Exhaustive Tech Stack](#rocket-exhaustive-tech-stack)
  - [⚙️ Comprehensive Installation & Setup Guide](#gear-comprehensive-installation--setup-guide)
    - [📋 Prerequisites](#-prerequisites)
    - [🔑 Procuring Third-Party API Keys](#-step-1-procuring-third-party-api-keys)
    - [💻 Clone the Repository](#-step-2-clone-the-repository)
    - [📦 Install Dependencies](#-step-3-install-dependencies)
    - [⚙️ Environment Variables (.env)](#️-step-4-environment-variables-env)
    - [🗄️ Database Initialization](#️-step-5-database-initialization-optional)
    - [🚀 Start the Server](#-step-6-start-the-server)
    - [🛠️ Common Troubleshooting](#️-common-troubleshooting)
- Backend: Node.js, Express 5, Mongoose, Passport.js
- Frontend: EJS, EJS-Mate, Bootstrap, vanilla JavaScript
- Database: MongoDB
- Services: Cloudinary, Mapbox, Razorpay, Nodemailer, Groq, Cohere

---
## Project Structure

## 📖 Project Overview
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

**Wanderlust** is a fully functional web-based marketplace closely mirroring the functionality of platforms like Airbnb. The core premise is simple: empower property owners to easily list their locations and enable travelers around the world to find and book unique accommodations seamlessly. 
## Getting Started

However, Wanderlust pushes beyond the basics. It integrates advanced features ranging from **Mapbox Geo-Coding** to find properties interactively, to an **AI Chatbot** aiding user experience, a **Secure Razorpay Payment Gateway**, and a fully-fledged **Admin Management Dashboard**. It is designed with the user completely in mind—delivering modern aesthetics, snappy pagination, advanced search metrics, and robust security protocols.
### 1. Install dependencies

---
```bash
npm install
```

## :sparkles: Comprehensive Feature Breakdown
### 2. Create your environment file

Wanderlust has evolved significantly over time. Below is every single feature packed into the platform, making it a robust, production-ready system.
Create a `.env` file in the project root and add the values you need:

### 🏨 Core Listing & Property Management
*   **Dynamic Listings Directory**: A highly responsive, visual grid showcasing thousands of different properties around the world.
*   **Intuitive Creation Flow**: Seamless forms for authentic users to create, detail, and list their properties with price, descriptions, and uploaded images.
*   **Cloudinary Image Hosting**: Fully integrated image upload system using Multer & Cloudinary. Images are instantly uploaded, optimized, and served to users worldwide seamlessly.
*   **Listing Pagination**: Efficient server-side pagination ensuring blazing fast load speeds even with massive databases of properties. No endless lagging scrolls.
*   **Advanced Filtering**: A dynamic, interactive filter bar allowing users to narrow down options by property type (e.g., Villas, Castles, Camping, Beachfront, Pools).
*   **Wishlist System**: Let users click a "Heart" and save their favorite dream destinations to a personal wishlist for later review.
```env
ATLASDB_URL=mongodb://127.0.0.1:27017/vanderlust
PORT=8080
SESSION_SECRET=your_session_secret

### 📍 Interactive Maps & Geolocation
*   **Mapbox SDK Integration**: Complete integration of Mapbox SDK to provide interactive mapping functionalities.
*   **Automatic Geocoding**: When a user inputs an address or city during listing creation, the backend automatically converts it to Longitude/Latitude coordinates.
*   **Interactive Property Maps**: Every listing details page includes a custom map pin to clearly show travelers exactly where they will be staying.
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

### 💳 Complete Booking & Payment Architecture
*   **Integrated Booking Engine**: Users can select dates, review total costs (calculating nights + price), and click "Book Now".
*   **Real-time Availability Status**: Check functionality to ensure properties aren't double-booked.
*   **Razorpay Gateway**: Integration of Razorpay ensuring smooth, seamless, and mathematically secure payment checkout sessions. Includes dynamic modals directly on the platform.
*   **Confirmation Tracking**: Successful orders create immediate Booking objects in the database associated with both the property owner and the traveling user.
MAPBOX_TOKEN=your_mapbox_token

### 👥 User Engagement & Profiles
*   **User Dashboard / Profiles**: Dedicated personal dashboard pages mapping out a user's *Active Listings* alongside their *Booking History*.
*   **Granular Review System**: A fully relational review system for properties. Users can submit 1 to 5-star ratings alongside written comments.
*   **Strict Review Validation**: Backend logic preventing span, blocking duplicate reviews, and explicitly stopping property owners from artificially rating their own listings.
*   **Automated Email Activities**: Hooked to *Nodemailer* functionalities. Sends confirmation emails for registrations, bookings, and alerts.

### 🤖 Smart Functionalities
*   **AI Feature Implementations**: Integrated AI algorithms.
*   **Interactive Chatbot**: An embedded smart assistant acting as customer service. Assisting users with navigation, answering FAQ queries regarding how to book, and managing profile settings.

### 🛡️ Administration & Security Panel
*   **Master Admin Dashboard**: A specialized protected `/admin` route explicitly accessible only to users with an 'admin' role privileges.
*   **Platform Statistics**: Visually summarizes platform health—total user counts, total live listings, total executed bookings, and transaction numbers.
*   **Moderation Controls**: Complete ability for the admin to DELETE abusive listings, remove fake users, or cancel flagged bookings.
*   **Admin Toggling**: Super-admin features allowing the promotion or demotion of other user accounts to Admin status.

### 🔒 Backend Safety & Integrity Protocols
*   **Passport.js Authentication**: Strong local authentication schemas protecting user data, including protected routing checking standard users vs logged out users.
*   **Dotenv Data Guarding**: Explicit decoupling of environment variables preventing Git exposure.
*   **Comprehensive Error Handling**: Dynamic Express error handling middleware wrapping all asynchronous calls ensuring the app never crashes.
*   **Schema Validations**: Usage of `Joi` API validation on every POST/PUT request ensuring corrupted or malicious payloads never reach the MongoDB instance.

---

## :camera_flash: Application Screenshots

Below is an exhaustive visual tour of every single page and major functionality of the Wanderlust platform.

*(Note: Replace the placeholder image URLs below with your project's actual HD screenshots)*
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
