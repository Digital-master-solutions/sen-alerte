import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BreachCheckResult {
  breached: boolean;
  count: number;
}

export function usePasswordBreachCheck() {
  const [isChecking, setIsChecking] = useState(false);

  const checkPassword = async (password: string): Promise<BreachCheckResult> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-password-breach', {
        body: { password },
      });

      if (error) {
        console.error('Password breach check error:', error);
        // Fail open - allow password if check fails
        return { breached: false, count: 0 };
      }

      return data as BreachCheckResult;
    } catch (error) {
      console.error('Password breach check error:', error);
      // Fail open - allow password if check fails
      return { breached: false, count: 0 };
    } finally {
      setIsChecking(false);
    }
  };

  return { checkPassword, isChecking };
}
