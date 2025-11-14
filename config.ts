// This file is dedicated to handling environment variables.
// On platforms like Netlify, Vercel, or during a local build process,
// environment variables (like API_KEY) are securely injected.
// This code reads the API key directly from the process environment.

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("API_KEY environment variable is not set. Please configure it in your deployment environment (e.g., Netlify settings). The application's AI features will be disabled.");
}

export { API_KEY };
