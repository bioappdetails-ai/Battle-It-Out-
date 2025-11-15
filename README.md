# Battle It Out

A social video-battle platform that allows users to upload short videos, challenge other users, and compete for votes in real-time. Battle It Out combines the creative aspects of short-form media platforms with competitive engagement and community-driven voting.

## 📱 Overview

Battle It Out is a cross-platform mobile application that enables users to create and participate in one-on-one video battles, vote on competing videos, and interact with the community through messaging and real-time notifications.

## 🎯 Objectives

- Create a competitive short-video platform for creative users
- Provide a seamless and secure mobile experience across Android and iOS
- Integrate real-time voting, messaging, and notifications using Firebase
- Leverage Cloudinary for efficient video storage and delivery
- Maintain a scalable backend capable of supporting thousands of concurrent users

## ✨ Key Features

### User Management
- Secure registration and login (email or social login)
- Password reset functionality
- Profile management with customizable profile pictures
- Secure logout

### Video Battles
- Upload short videos to participate in battles
- Create one-on-one battles by challenging other users
- Challenge winners or losers after battles with new videos
- Spectate existing battles and watch competing videos

### Voting System
- Real-time voting on competing videos
- Live results display
- Search battles by categories
- View battle feeds (New, Trending, Game Battles)

### Social Features
- Direct messaging between users
- View other users' profiles
- View your own uploaded videos
- Real-time updates for messages, votes, and notifications

### Notifications
- In-app and push notifications for:
  - New challenges
  - Messages
  - Battle results
  - Voting updates

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development framework and tooling

### Backend Services
- **Firebase**
  - Authentication (email/social login)
  - Firestore (real-time database)
  - Push Notifications
- **Cloudinary**
  - Video upload and storage
  - Video optimization and compression
  - CDN-based content delivery

### Development Tools
- **Visual Studio Code** - IDE
- **Expo Testing Library** - Testing framework

## 📋 Requirements

### Functional Requirements
- User registration and authentication
- Video upload and battle creation
- Real-time voting system
- Direct messaging
- Push notifications
- Profile management
- Battle feed with categories

### Non-Functional Requirements
- Compatible with Android (v8.0+) and iOS (v13+)
- Clean and intuitive UI/UX
- Real-time notifications
- Auto-logout after inactivity
- Support for 10,000+ concurrent users

## 🏗️ Architecture

The application follows a **client-server architecture** integrated with cloud-based services:

```
Mobile App (React Native)
    ↓
Firebase (Authentication, Firestore, Notifications)
    ↓
Cloudinary (Video Storage, Optimization, CDN)
```

### Key Components
- **Client (Mobile App)**: Handles user interface and interactions
- **Backend Services**: Firebase for data and user management
- **Media Service**: Cloudinary for video optimization and delivery

## 📦 Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## 🔐 Dependencies

- Users must have internet access
- Sufficient device storage for video uploads
- Firebase and Cloudinary services must be operational
- Content must comply with community guidelines and store policies

## 👥 Target Users

- Individuals aged 13 and above
- Users who enjoy short-form video content and competitive entertainment
- Content creators seeking recognition and social interaction
- Users with basic knowledge of mobile apps and social media

## 📄 License

This project is private and proprietary.

## 🔄 Development Methodology

The project follows **Agile development methodology**, emphasizing:
- Iterative design
- User feedback
- Continuous improvement

## 📝 Notes

- Video size and length may be restricted to optimize storage and performance
- The system requires an active internet connection for all core features
- Third-party service dependencies (Firebase and Cloudinary) may affect system availability
- Must comply with Google Play Store and Apple App Store content and privacy guidelines

