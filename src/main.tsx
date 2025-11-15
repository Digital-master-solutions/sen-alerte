import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useAuthStore } from '@/stores/authStore'

// Handle GitHub Pages redirect
if (sessionStorage.redirect) {
  sessionStorage.redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
}

// Initialize auth on app load
useAuthStore.getState().initializeAuth();

createRoot(document.getElementById("root")!).render(<App />);
