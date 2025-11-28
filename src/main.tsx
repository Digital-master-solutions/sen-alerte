import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Handle GitHub Pages redirect
if (sessionStorage.redirect) {
  sessionStorage.redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
}

// Register Service Worker for map tiles caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker enregistré avec succès:', registration.scope);
        
        // Nettoyer le cache périodiquement (tous les jours)
        setInterval(() => {
          registration.active?.postMessage({ type: 'CLEAN_CACHE' });
        }, 24 * 60 * 60 * 1000);
      })
      .catch((error) => {
        console.log('Échec de l\'enregistrement du Service Worker:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
