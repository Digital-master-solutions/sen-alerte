import { useEffect } from 'react';

export function SecurityHeaders() {
  useEffect(() => {
    // Add security headers that can be set via meta tags
    const addMetaTag = (httpEquiv: string, content: string) => {
      const existingMeta = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
      if (!existingMeta) {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', httpEquiv);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // These security headers can be set via meta tags
    addMetaTag('X-Content-Type-Options', 'nosniff');
    addMetaTag('X-XSS-Protection', '1; mode=block');
    addMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Note: X-Frame-Options cannot be set via meta tags and must be set as HTTP header

    // Add DNS prefetch hints for performance
    const addDnsPrefetch = (href: string) => {
      const existingLink = document.querySelector(`link[rel="dns-prefetch"][href="${href}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    };

    addDnsPrefetch('https://mjhsvrksrmcemhbglfkm.supabase.co');
    addDnsPrefetch('https://nominatim.openstreetmap.org');

  }, []);

  return null;
}