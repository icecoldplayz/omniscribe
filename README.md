OmniScribe AI
Transform raw lecture audio into a personalized, interactive learning universe.

Overview
OmniScribe AI turns passive, tedious lecture listening into an active learning experience. By combining real-time audio transcript processing with high-level concept mapping, OmniScribe converts course recordings into structured Knowledge Graphs, proactive Confusion Detection alerts, adaptive AI Tutoring, and personalized Study Plans mapped directly to your exam dates.

Key Features
Visual Knowledge Graph: Automatically extracts core concepts from transcripts, identifies prerequisite relationships, and visualizes topic mastery in real time.

Dynamic AI Tutor: Adapts explanations to how you learn best. Select your preferred style—such as Sports Analogies, Programming Metaphors, or Storytelling—and receive customized explanations tailored to your grade level.

Predictive Confusion Detection: Identifies subtle mental hurdles and frequently mixed-up concepts (e.g., confusing the Sanding Metaphor with the Editing Process) before they cost you points on exams.

Automated Study Plans: Input your target exam date, and OmniScribe calculates your remaining prep timeline to generate a daily, step-by-step study schedule.

Adaptive Quizzes & Mastery Tracking: Generates context-aware multiple-choice quizzes with detailed answer rationales to measure topic proficiency.

Interactive Lecture Timeline: Jump directly to key moments, concepts, and definitions using automated lecture timestamps.

Tech Stack
Frontend: React, Vite, Tailwind CSS, Lucide Icons

Backend & Auth: Supabase (Database, Auth, Storage)

AI Engine: Grok API (xAI) for fast, long-context reasoning and concept extraction

Deployment: Vercel

Getting Started
Follow these steps to set up and run OmniScribe AI locally on your machine.

Prerequisites
Node.js (v18.0 or higher)

npm or yarn

A Supabase account and project

An xAI / Grok API key

1. Clone the Repository
Bash
git clone https://github.com/YOUR_USERNAME/omniscribe-ai.git
cd omniscribe-ai
2. Install Dependencies
Bash
npm install
3. Configure Environment Variables
Create a .env.local file in the root directory and add your credentials:

Code snippet
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_XAI_API_KEY=your_grok_api_key
4. Run the Development Server
Bash
npm run dev
Open your browser and navigate to http://localhost:5173 to test the application locally.

Demo Access
If you prefer to review a pre-loaded account without configuring environment keys or signing in via Google:

Demo URL: https://your-app.vercel.app

Guest Access: Click the "Continue as Guest" button on the login screen to access.
