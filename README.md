# 📸 Groupify - Smart Photo Sharing for Group Trips

![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-11.7.3-ffca28?logo=firebase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/github/license/groupify-team/groupify)
![Last Commit](https://img.shields.io/github/last-commit/groupify-team/groupify)

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Packages Used](#-packages-used)
- [Installation](#-installation)
- [Folder Structure](#-folder-structure-client)
- [Known Issues](#-known-issues)
- [Contributors](#-contributors)

---

Groupify is a modern web app that helps groups of friends upload, manage, and share photos from trips — using **face recognition** to automatically deliver personalized galleries.

Built with **React**, **Vite**, and **Firebase**, the app supports trip creation, friend management, photo uploads, and more.

---

## ✨ Features

- User authentication (sign up / log in / reset password)
- Create and join trips
- Upload and browse trip-specific photos
- Add and manage friends
- Dashboard with real-time updates
- Personalized gallery (coming soon)
- Face recognition & tagging (coming soon)

---

## 🎨 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend & Auth**: Firebase (Auth, Firestore, Storage)
- **Recognition**: External Face Recognition API (planned)
- **Hosting**: Firebase Hosting or Vercel

---

## 📦 Packages Used

| Category       | Package                                                                 | Purpose                          |
| -------------- | ----------------------------------------------------------------------- | -------------------------------- |
| UI Components  | `@mui/material`, `@heroicons/react`, `lucide-react`                     | Modals, icons, styled components |
| Styling        | `tailwindcss`, `tailwind-variants`, `clsx`                              | Utility-first CSS + variants     |
| Auth & Backend | `firebase`, `uuid`                                                      | Auth, Firestore, Storage         |
| File Upload    | `react-dropzone`, `react-easy-crop`                                     | Upload + crop UI                 |
| Face Detection | `@aws-sdk/client-rekognition`, `face-api.js`, `@mediapipe/tasks-vision` | AI-based recognition             |
| UX Enhancers   | `react-toastify`, `react-hot-toast`, `react-lazy-load-image-component`  | Toasts, lazy loading             |
| Routing        | `react-router-dom`                                                      | SPA navigation                   |
| Dev Tools      | `vite`, `eslint`, `postcss`, `@vitejs/plugin-react`                     | Build and linting                |

---

## 🔧 Installation

```bash
# 1. Clone the repo
https://github.com/groupify-team/groupify.git

# 2. Enter the client directory
cd client

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev
```

Create a `.env` file in `client/` with:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_id
```

---

## 🔍 Folder Structure (client/)

```
client/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── App.jsx
├── public/
└── .env
```

---

## 🚫 Known Issues

- Face recognition integration in progress
- Responsive layout on some mobile views
- Dashboard may evolve with design changes

---

## 👨‍💼 Contributors

| Name       | Role                      | GitHub                                   |
| ---------- | ------------------------- | ---------------------------------------- |
| Adir Edri  | Fullstack & Deep Learning | [@adiredri](https://github.com/adiredri) |
| Ofir Almog | Fullstack & Deep Learning | [@Ofigu](https://github.com/Ofigu)       |

---
