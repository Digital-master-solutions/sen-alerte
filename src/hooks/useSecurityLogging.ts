import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  details?: Record<string, any>;
}

export function useSecurityLogging() {
  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      // Only log if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('log_security_event', {
        _event_type: event.event_type,
        _details: event.details || null
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  // Log page views for authenticated users
  useEffect(() => {
    const logPageView = () => {
      logSecurityEvent({
        event_type: 'page_view',
        details: {
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });
    };

    // Log initial page view
    logPageView();

    // Log page changes
    const handlePopState = () => logPageView();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return { logSecurityEvent };
}