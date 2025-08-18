import { useEffect } from 'react';

export function SecurityHeaders() {
  useEffect(() => {
    // Add security headers via meta tags where possible
    const addMetaTag = (httpEquiv: string, content: string) => {
      const existingMeta = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
      if (!existingMeta) {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', httpEquiv);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Security headers
    addMetaTag('X-Content-Type-Options', 'nosniff');
    // Removed X-Frame-Options: DENY to allow embedding in Lovable iframe
    addMetaTag('X-XSS-Protection', '1; mode=block');
    addMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add Content Security Policy
    addMetaTag('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://mjhsvrksrmcemhbglfkm.supabase.co https://nominatim.openstreetmap.org; " +
      "font-src 'self' data:; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );

    // Preconnect to external domains for performance
    const addPreconnect = (href: string) => {
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        document.head.appendChild(link);
      }
    };

    addPreconnect('https://mjhsvrksrmcemhbglfkm.supabase.co');
    addPreconnect('https://nominatim.openstreetmap.org');

  }, []);

  return null;
}