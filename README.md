# Groupify - Collaborative Photo Management for Trips

Groupify is a web application that allows groups of friends to automatically upload, organize, and share trip photos - with a focus on **face recognition** and **personalized access**.  
Each user gets only the photos they appear in, without manually sorting through thousands of group shots.

---

## Project Status

This project is currently **under active development**.  
Some features are already implemented, and more are being added weekly.

---

## Tech Stack

The application is built using the following technologies:

- **Frontend**: React (Vite), Tailwind CSS
- **Backend & Auth**: Firebase (Firestore, Storage, Authentication)
- **Image Recognition**: (Planned) Face recognition via external API
- **Hosting**: Firebase Hosting / Vercel *(to be decided)*

---

## What’s Working So Far

- User registration, login, and logout
- Creating and managing trips
- Uploading photos per trip
- Viewing photo galleries
- Adding friends and managing friend requests
- A functional dashboard with modular UI

---

## Upcoming Features

We’re currently working on:

1. Face recognition and automatic filtering by user
2. Notifications for friend requests and trip invites
3. Personal profile pages with editable user info
4. Smart photo cropping inside profile settings
5. Enhanced trip management tools for admins

---

## Folder Structure (High-Level)

```
client/
├── src/
│   ├── components/       # Reusable components (PhotoUpload, TripCard, etc.)
│   ├── pages/            # Route-level views like Home, Dashboard, Profile
│   ├── services/         # Firebase setup and API logic
│   ├── hooks/            # Custom React hooks
│   └── App.jsx           # Root component with routing logic
├── public/               # Static files and assets
└── .env                  # Environment variables (not committed)
```

---

## Running the Project Locally (For Developers)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/groupify.git

# 2. Navigate to the frontend folder
cd client

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Create a `.env` file in the `client/` directory with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Known Issues

```text
- Face recognition integration is pending.
- Some mobile layouts are incomplete.
- Dashboard components may change as design evolves.
```

---

## Contributors

| Name        | Role                         | GitHub Profile                        |
|-------------|------------------------------|----------------------------------------|
| Adir Edri   | Fullstack & Deep Learning    | [@adiredri](https://github.com/adiredri) |
| Ofir Almog  | Fullstack & Deep Learning    | [@Ofigu](https://github.com/Ofigu)       |

---
