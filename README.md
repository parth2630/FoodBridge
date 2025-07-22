# Food Waste Donation Platform

A platform connecting food donors (hotels, events, homes) with NGOs for efficient food waste management and distribution.

## Features

- User Authentication (Donor & NGO)
- Dynamic Dashboard for both Donors and NGOs
- Food Listing Creation
- Real-time Donation Status Tracking
- Analytics Dashboard
- Interactive Maps
- Profile Management

## Tech Stack

- React.js
- Firebase (Authentication, Firestore, Storage)
- Material-UI
- Chart.js
- React Router
- Google Maps API

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Google Maps API key

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd food-waste-donation
```

2. Install dependencies:
```bash
npm install
```

3. Create a Firebase project and enable:
   - Authentication
   - Firestore Database
   - Storage

4. Create a `.env` file in the root directory with your Firebase configuration:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

5. Start the development server:
```bash
npm start
```

## Project Structure

```
food-waste-donation/
├── public/
│   ├── index.html
│   └── assets/
│       └── images/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── food-listing/
│   │   ├── analytics/
│   │   └── common/
│   ├── pages/
│   │   ├── AuthPage.js
│   │   ├── DonorDashboard.js
│   │   ├── NGODashboard.js
│   │   ├── FoodListing.js
│   │   └── Analytics.js
│   ├── services/
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   └── database.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── utils/
│   │   └── helpers.js
│   ├── styles/
│   │   └── global.css
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 