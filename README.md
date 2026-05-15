# Eous AI Mentor

An AI-powered study assistant designed to help students learn effectively, track their progress, and master academic subjects.

## 🚀 Introduction

Eous AI Mentor is a smart, interactive educational platform that leverages the power of AI to provide personalized tutoring. Whether you need a quick summary, a detailed breakdown, or a step-by-step guide, Eous adapts to your learning style. It also helps you organize your study materials, take quizzes, and track your growth through a gamified experience.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Lucide React (Icons)
- **Backend & Database**: Supabase (Authentication, Multi-Factor Authentication (MFA), Database)
- **AI Integration**: Google Gemini API
- **Mobile Support**: Capacitor (for native Android application)
- **State Management & Hooks**: React Hooks (useState, useEffect, useRef)

## 🏗️ System Architecture

The application follows a client-heavy architecture with a serverless backend:

1. **Client (Web & Mobile)**: The user interface is built with React and styled with Tailwind CSS. It handles user interactions, local state, and communicates with external services. Capacitor wraps the web app to run natively on Android.
2. **Backend as a Service (BaaS)**: **Supabase** handles user authentication, session management, and data persistence (messages, bookmarks, quizzes, stats). It provides security and real-time capabilities.
3. **AI Layer**: The app communicates directly with the **Google Gemini API** (using the `@google/generative-ai` SDK) to generate educational responses based on user queries and strict system prompts.

## 🔄 Workflow

1. **Authentication & Onboarding**:
   - Users register and log in via Supabase Auth (with optional MFA).
   - New users go through an onboarding flow to select their education level, subjects of interest, and preferred explanation style.
2. **Learning & Chat**:
   - Users ask questions to Eous.
   - Eous responds strictly within the educational domain, adhering to the user's preferred explanation style (Short, Detailed, or Step-by-Step).
3. **Library & Organization**:
   - Users can bookmark helpful responses and organize them into custom folders for future reference.
4. **Quizzes & Assessment**:
   - The app automatically suggests or generates quizzes based on the chat history.
   - Users take quizzes to test their knowledge and earn XP.
5. **Progress Tracking**:
   - The **Dashboard** displays total queries, library items, study streak, level, XP, and subject focus percentages based on interaction history.

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- NPM
- Supabase Account & Project
- Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vtniscoding/eous-ai-mentor.git
   cd eous-ai-mentor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables (Do not commit this file!):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Mobile Build (Android)

1. Build the web project:
   ```bash
   npm run build
   ```
2. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```
3. Open in Android Studio:
   ```bash
   npx cap open android
   ```
