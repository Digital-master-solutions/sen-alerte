import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Handle GitHub Pages redirect
if (sessionStorage.redirect) {
  sessionStorage.redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
}

createRoot(document.getElementById("root")!).render(<App />);
