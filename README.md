# 📸 Groupify

A modern social photo sharing and event management application with AI-powered face recognition, built with React and Firebase.

## ✨ Features

### 🎉 Event Management
- **Create & Organize Events**: Plan gatherings with date, location, and description
- **Member Management**: Invite friends and manage event participants
- **Event Statistics**: Track photo uploads, member activity, and event engagement
- **Real-time Updates**: See live changes as members interact with events

### 📷 Smart Photo Sharing
- **Bulk Photo Upload**: Upload multiple photos simultaneously with drag-and-drop
- **AI-Powered Face Recognition**: Automatically identify and tag people in photos using face-api.js
- **Face Profile Management**: Train the system to recognize you and your friends
- **Photo Gallery**: Beautiful grid and masonry layouts for browsing event photos
- **Download Options**: Download individual photos or entire event albums as ZIP files
- **Photo Filtering**: Find your photos instantly with AI face matching

### 👥 Social Features
- **Friend System**: Connect with friends and manage relationships
- **User Presence**: See who's online in real-time
- **Event Invitations**: Send and receive event invites
- **User Profiles**: Customizable profiles with bio, location, and profile pictures

### 🎨 User Experience
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG-compliant with keyboard navigation and screen reader support
- **Smooth Animations**: Page transitions and interactive UI elements
- **Performance Optimized**: Lazy loading, code splitting, and efficient rendering

### 🔒 Security & Privacy
- **Email Verification**: Secure account verification system
- **Password Reset**: Safe password recovery flow
- **Protected Routes**: Authentication-required pages and resources
- **Firestore Security Rules**: Server-side data access control
- **Turnstile CAPTCHA**: Bot protection for authentication

### 💳 Subscription Plans
- **Free Tier**: Basic features for casual users
- **Pro Plan**: Enhanced limits via Stripe integration
- **Usage Tracking**: Monitor photo uploads and storage consumption
- **Plan Enforcement**: Automatic limit enforcement based on subscription tier

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 19 with Hooks
- **Build Tool**: Vite 6
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 3 with custom theme
- **UI Components**: 
  - Radix UI primitives
  - Material-UI components
  - Custom component library
  - Lucide & Phosphor icons

### Backend & Services
- **Backend**: Firebase (Firestore, Storage, Functions, Hosting)
- **Authentication**: Firebase Auth with custom email verification
- **Database**: Cloud Firestore with real-time sync
- **Storage**: Firebase Cloud Storage for photos
- **Functions**: Node.js 20 serverless functions
- **Email**: Nodemailer with custom HTML templates
- **Payments**: Stripe integration for subscriptions

### AI & Computer Vision
- **Face Detection**: face-api.js (SSD MobileNetV1)
- **Face Recognition**: 128D face descriptors with Euclidean distance matching
- **Face Landmarks**: 68-point facial landmark detection
- **Age/Gender**: Optional demographic analysis
- **Expression Detection**: Emotion recognition capabilities

### Development Tools
- **Testing**: Jest with React Testing Library
- **Linting**: ESLint with React plugins
- **Version Control**: Git with conventional commits
- **Package Manager**: npm with workspaces
- **CI/CD**: Firebase Hosting with GitHub integration

## 📁 Project Structure

```
Groupify/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets
│   │   ├── models/                  # Face recognition ML models
│   │   └── groupifyLogo.png         # App logo
│   ├── src/
│   │   ├── auth-area/               # Authentication module
│   │   │   ├── components/          # Auth UI components
│   │   │   ├── contexts/            # AuthContext provider
│   │   │   ├── hooks/               # useAuth, useAuthValidation
│   │   │   ├── pages/               # SignIn, SignUp, ForgotPassword, etc.
│   │   │   └── services/            # authService API
│   │   ├── dashboard-area/          # Main application area
│   │   │   ├── components/          # Dashboard UI components
│   │   │   ├── features/
│   │   │   │   ├── events/          # Event management
│   │   │   │   │   └── ViewEvent/   # Event detail page
│   │   │   │   │       ├── features/
│   │   │   │   │       │   ├── faceRecognition/  # Face detection & matching
│   │   │   │   │       │   ├── gallery/          # Photo grid/masonry
│   │   │   │   │       │   ├── header/           # Event header
│   │   │   │   │       │   ├── members/          # Member management
│   │   │   │   │       │   └── statistics/       # Event stats
│   │   │   │   ├── friends/         # Friend system
│   │   │   │   ├── photos/          # Personal photo library
│   │   │   │   ├── profile/         # User profile
│   │   │   │   └── settings/        # App settings
│   │   │   ├── hooks/               # Dashboard-specific hooks
│   │   │   └── pages/               # Dashboard page components
│   │   ├── public-area/             # Landing and public pages
│   │   │   ├── components/          # Public UI components
│   │   │   ├── pages/               # Landing, About, Contact, etc.
│   │   │   └── services/            # Public API services
│   │   ├── shared/                  # Shared resources
│   │   │   ├── components/          # Reusable UI components
│   │   │   │   ├── accessibility/   # A11y providers
│   │   │   │   ├── routing/         # Route controllers
│   │   │   │   └── ui/              # UI primitives
│   │   │   ├── constants/           # App constants
│   │   │   ├── contexts/            # Global contexts (Theme, Friends, Events)
│   │   │   ├── hooks/               # Shared hooks
│   │   │   ├── services/            # Firebase services
│   │   │   │   ├── firebase/        # Firebase SDK wrappers
│   │   │   │   └── presence/        # User presence system
│   │   │   └── utils/               # Utility functions
│   │   ├── styles/                  # Global styles
│   │   │   ├── base/                # Reset & base styles
│   │   │   ├── components/          # Component styles
│   │   │   ├── themes/              # Theme definitions
│   │   │   └── utilities/           # CSS utilities
│   │   ├── tests/                   # Test suites
│   │   │   ├── __mocks__/           # Test mocks
│   │   │   ├── api/                 # API tests
│   │   │   ├── components/          # Component tests
│   │   │   └── database/            # Firestore query tests
│   │   ├── App.jsx                  # Root component
│   │   └── main.jsx                 # App entry point
│   ├── index.html                   # HTML template
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind configuration
│   ├── jest.config.js               # Jest configuration
│   └── package.json                 # Frontend dependencies
├── functions/                       # Firebase Cloud Functions
│   ├── email-templates/             # HTML email templates
│   │   ├── contactus.html           # Contact form template
│   │   ├── resetpassword.html       # Password reset template
│   │   ├── verification.html        # Email verification template
│   │   └── welcome.html             # Welcome email template
│   ├── index.js                     # Functions entry point
│   ├── openweather-proxy.js         # Weather API proxy
│   └── package.json                 # Functions dependencies
├── docs/                            # Documentation
│   ├── firebaseCollection.txt       # Firestore schema
│   ├── gitCommands.txt              # Git workflow guide
│   └── projectStructure.txt         # Project structure
├── firebase.json                    # Firebase configuration
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Firestore indexes
├── storage.rules                    # Storage security rules
└── package.json                     # Root workspace config
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or v20.x (LTS recommended)
- **npm**: v9.x or higher
- **Firebase CLI**: Latest version
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/groupify-team/Groupify.git
   cd Groupify
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   # Or install individually:
   # npm install              # Root dependencies
   # cd client && npm install # Frontend dependencies
   # cd functions && npm install # Functions dependencies
   ```

3. **Firebase Setup**
   
   Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   
   Enable the following services:
   - Authentication (Email/Password)
   - Cloud Firestore
   - Cloud Storage
   - Cloud Functions
   - Hosting

4. **Environment Configuration**

   Create `client/src/shared/services/firebase/config.js`:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getStorage } from 'firebase/storage';
   import { getFunctions } from 'firebase/functions';

   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const storage = getStorage(app);
   export const functions = getFunctions(app);
   ```

5. **Configure Function Secrets**

   Set up required secrets for Cloud Functions:
   ```bash
   firebase functions:secrets:set EMAIL_USER
   firebase functions:secrets:set EMAIL_PASSWORD
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   firebase functions:secrets:set OPENWEATHER_API_KEY
   ```

### Development

1. **Start the development server**
   ```bash
   npm run dev
   # Runs: Vite dev server + OpenWeather proxy
   # Frontend: http://localhost:5173
   # Weather Proxy: http://localhost:3001
   ```

2. **Run Firebase emulators (optional)**
   ```bash
   firebase emulators:start
   ```

3. **Run tests**
   ```bash
   cd client
   npm test              # Run all tests
   npm run test:watch    # Watch mode
   npm run test:coverage # With coverage report
   ```

### Production Build

1. **Build the client**
   ```bash
   npm run build
   # Output: client/dist/
   ```

2. **Deploy to Firebase**
   ```bash
   # Deploy everything
   npm run deploy

   # Or deploy individually:
   npm run deploy:hosting    # Frontend only
   npm run deploy:functions  # Functions only
   npm run deploy:firestore  # Rules only
   npm run deploy:storage    # Storage rules only
   ```

## 📊 Database Schema

### Collections

#### `users`
```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,
  displayName: string,
  photoURL: string,
  profilePicture: string,
  bio: string,
  location: string,
  birthdate: timestamp,
  gender: string,
  friends: array,           // Array of friend UIDs
  events: array,            // Array of event IDs
  photoCount: number,
  emailVerified: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  joinedAt: timestamp
}
```

#### `events`
```javascript
{
  id: string,
  name: string,
  description: string,
  location: string,
  startDate: timestamp,
  endDate: timestamp,
  createdBy: string,        // User UID
  admins: array,            // Admin UIDs
  members: array,           // Member UIDs
  photoCount: number,
  planAtCreation: string,   // 'free' | 'pro'
  planLimits: object,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `eventPhotos`
```javascript
{
  eventId: string,
  uploadedBy: string,       // User UID
  fileName: string,
  originalName: string,
  filePath: string,
  downloadURL: string,
  type: string,             // MIME type
  size: number,             // Bytes
  planAtUpload: string,
  facesDetected: number,
  facesProcessed: boolean,
  faceMatches: array,       // Array of matched user UIDs
  uploadedAt: timestamp,
  lastModified: timestamp
}
```

#### `faceProfiles`
```javascript
{
  userId: string,
  images: array,            // Training image URLs
  method: string,           // 'face-api' | 'mediapipe'
  engine: string,
  metadata: object,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `friendRequests`
```javascript
{
  from: string,             // Sender UID
  to: string,               // Recipient UID
  status: string,           // 'pending' | 'accepted' | 'rejected'
  createdAt: timestamp
}
```

#### `eventInvites`
```javascript
{
  eventId: string,
  inviterUid: string,
  inviteeUid: string,
  status: string,           // 'pending' | 'accepted' | 'declined'
  createdAt: timestamp
}
```

## 🔧 Configuration

### Vite Configuration

Key features in `client/vite.config.js`:
- Path aliases (`@/`, `@auth/`, `@shared/`, etc.)
- React plugin with Fast Refresh
- Optimized chunking strategy
- Development server on port 5173

### Tailwind Configuration

Custom theme extends in `client/tailwind.config.js`:
- Custom color palette
- Extended spacing scale
- Custom animations
- Dark mode support via class strategy

### Firebase Configuration

Services configured in `firebase.json`:
- **Hosting**: SPA rewrites, custom headers
- **Functions**: Node.js 20 runtime
- **Firestore**: Security rules and indexes
- **Storage**: Access control rules
- **Emulators**: Storage on port 9199

## 🧪 Testing

### Test Structure
```
client/src/tests/
├── setup.js                    # Test environment setup
├── __mocks__/                  # Mock implementations
│   └── firebase.js
├── api/                        # API integration tests
│   └── userServices.test.js
├── components/                 # Component unit tests
│   └── EventCard.test.js
└── database/                   # Firestore query tests
    └── firestoreQueries.test.js
```

### Running Tests
```bash
cd client

# All tests
npm test

# Specific test file
npm test EventCard

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Pricing enforcement tests
npm run test:pricing
```

## 🎨 Theming

### Theme System
- **Provider**: `ThemeContext` with system preference detection
- **Storage**: LocalStorage persistence
- **Toggle**: Smooth transitions between light/dark modes
- **Variables**: CSS custom properties for dynamic theming

### Customization
Edit `client/tailwind.config.js` to customize:
- Colors and gradients
- Typography scale
- Spacing and sizing
- Border radius
- Shadow depths
- Animation timings

## 🔐 Security

### Authentication Flow
1. User signs up with email/password
2. Verification code sent via email
3. User verifies code to activate account
4. Password reset with secure token flow
5. Turnstile CAPTCHA for bot protection

### Firestore Security Rules
- User data readable only by owner or friends
- Events readable by members only
- Photos accessible only to event members
- Admin-only operations protected
- Rate limiting on sensitive operations

### Storage Security Rules
- Users can upload to their own folders
- Event photos restricted to event members
- File size and type validation
- Authenticated access required

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
- Touch-optimized interactions
- Swipe gestures on photo galleries
- Responsive navigation patterns
- Optimized image loading

## ⚡ Performance Optimizations

### Frontend
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Lazy loading with react-lazy-load-image-component
- **Memoization**: React.memo and useMemo for expensive computations
- **Virtual Scrolling**: Efficient rendering of large photo lists
- **Bundle Analysis**: Optimized chunk sizes

### Backend
- **Firestore Indexes**: Optimized query performance
- **Pagination**: Cursor-based pagination for large collections
- **Caching**: Strategic use of Firebase cache
- **Batch Operations**: Grouped writes for efficiency

### Face Recognition
- **Model Loading**: Progressive model loading
- **Worker Threads**: Face detection in Web Workers
- **Descriptor Caching**: Store computed face descriptors
- **Threshold Tuning**: Optimized matching thresholds

## 🛠️ Scripts Reference

### Root Scripts
```bash
npm run dev              # Start client dev server
npm run build            # Build client for production
npm run start            # Preview production build
npm run install-all      # Install all workspace dependencies
npm run deploy           # Deploy everything to Firebase
npm run deploy:hosting   # Deploy only hosting
npm run deploy:functions # Deploy only functions
npm run deploy:firestore # Deploy only Firestore rules
npm run deploy:storage   # Deploy only Storage rules
npm run serve            # Serve with Firebase locally
```

### Client Scripts
```bash
npm run dev              # Vite dev server + weather proxy
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm test                 # Run Jest tests
npm run test:watch       # Jest watch mode
npm run test:coverage    # Generate coverage report
npm run test:pricing     # Test pricing enforcement
```

### Functions Scripts
```bash
npm run serve            # Serve functions locally
npm run deploy           # Deploy functions to Firebase
npm run logs             # View function logs
npm run shell            # Functions shell for testing
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### Commit Convention
```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Add or update tests
chore: Maintenance tasks
```

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

## 🙏 Acknowledgments

### Technologies
- **React Team**: For the amazing React framework
- **Firebase**: For the comprehensive backend platform
- **Tailwind Labs**: For Tailwind CSS
- **Vite Team**: For the blazing-fast build tool
- **face-api.js**: For face recognition capabilities
- **Radix UI**: For accessible component primitives

### Libraries & Tools
- **React Router**: Client-side routing
- **React Hot Toast**: Elegant notifications
- **Lucide Icons**: Beautiful icon set
- **date-fns**: Date manipulation
- **JSZip**: ZIP file generation
- **Stripe**: Payment processing

## 📞 Support

For support, email [support@groupify.com](mailto:support@groupify.com) or visit our [Help Center](https://groupify.com/help).

## 🔗 Links

- **Website**: [https://groupify-77202.web.app](https://groupify-77202.web.app)
- **Repository**: [https://github.com/groupify-team/Groupify](https://github.com/groupify-team/Groupify)
- **Documentation**: [https://docs.groupify.com](https://docs.groupify.com)
- **Issue Tracker**: [https://github.com/groupify-team/Groupify/issues](https://github.com/groupify-team/Groupify/issues)

---

**Made with ❤️ by the Groupify Team**
