# AI Learning Assistant

An intelligent, full-stack educational web application designed to enhance the learning experience. By leveraging the power of Google's Gemini AI, this platform allows users to upload PDF documents and automatically generates interactive study materials, making learning faster, easier, and more engaging.

## 🚀 Features

- **Document Management**: Securely upload and manage your educational PDF materials.
- **AI-Powered Flashcards**: Automatically generate flashcards with varying difficulty levels based on document context. Includes features like marking cards for review and starring important concepts.
- **Automated Quizzes**: Generate multiple-choice quizzes to test your comprehension. The system provides immediate feedback and explanations for the correct answers.
- **Document Summarization**: Instantly extract key concepts and main ideas from lengthy texts.
- **Contextual AI Chat**: Ask questions directly related to the uploaded document, and the AI will provide answers based *only* on the provided context.
- **Concept Explanation**: Select a complex concept from the text and get a simplified, educational explanation.
- **Dashboard & Progress Tracking**: Keep track of your learning streak, reviewed flashcards, quiz scores, and recent activities.

## 🎯 Target Audience

This application is built for:
- **Students** looking to prepare for exams efficiently and automate their study workflows.
- **Educators** who want to quickly generate study materials, flashcards, and quizzes for their classes.
- **Professionals** needing to rapidly digest long reports, documentation, or technical manuals.
- **Lifelong Learners** who want to maximize their comprehension and retention of new subjects.

## 💻 Technologies Used

### Frontend
- **React.js** - UI Library for building the interactive interfaces
- **Tailwind CSS** - Modern, utility-first CSS framework for responsive design
- **React Router** - Client-side routing and navigation
- **Lucide React** - Clean and consistent iconography
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Beautiful, customizable toast notifications

### Backend
- **Node.js & Express.js** - Fast and scalable RESTful API server
- **MongoDB & Mongoose** - NoSQL database and object data modeling
- **Google Generative AI (Gemini 1.5 Flash)** - Core AI engine for generating educational content
- **JWT (JSON Web Tokens)** - Secure, stateless user authentication
- **Multer** - Middleware for handling multipart/form-data and PDF file uploads
- **Custom Text Chunker & PDF Parser** - Utilities for extracting and chunking text from uploaded files to provide accurate AI context

## 🛠️ Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB instance (local or MongoDB Atlas)
- Google Gemini API Key

### Installation

1. **Clone the repository**
2. **Setup Backend:**
   - Navigate to the `backend` directory.
   - Run `npm install`.
   - Create a `.env` file with your `MONGO_URI`, `JWT_SECRET`, `PORT`, and `GEMINI_API_KEY`.
   - Start the server using `npm run dev` or `npm start`.
3. **Setup Frontend:**
   - Navigate to the frontend directory (`frontened/ai-learning-assitant`).
   - Run `npm install`.
   - Start the development server using `npm run dev`.

---
*Built as a modern solution for AI-assisted learning.*