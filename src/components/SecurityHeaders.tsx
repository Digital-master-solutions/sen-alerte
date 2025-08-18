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
    addMetaTag('X-Frame-Options', 'DENY');
    addMetaTag('X-XSS-Protection', '1; mode=block');
    addMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');

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