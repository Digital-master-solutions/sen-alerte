import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface PermissionState {
  camera: 'granted' | 'denied' | 'pending' | 'unknown';
  microphone: 'granted' | 'denied' | 'pending' | 'unknown';
}

export function useMobilePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'unknown',
    microphone: 'unknown'
  });

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      setPermissions(prev => ({ ...prev, camera: 'pending' }));
      
      // Try to get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: window.innerWidth > 768 ? 1280 : 720 },
          height: { ideal: window.innerWidth > 768 ? 720 : 480 }
        } 
      });
      
      // Clean up immediately
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      
      toast.success("Accès à la caméra accordé");
      return true;
      
    } catch (error: any) {
      console.error('Camera permission error:', error);
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      
      if (error.name === 'NotAllowedError') {
        toast.error("Accès caméra refusé. Activez-la dans les paramètres de votre navigateur.");
      } else if (error.name === 'NotFoundError') {
        toast.error("Aucune caméra détectée sur cet appareil.");
      } else {
        toast.error("Impossible d'accéder à la caméra.");
      }
      
      return false;
    }
  }, []);

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      setPermissions(prev => ({ ...prev, microphone: 'pending' }));
      
      // Try to get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Clean up immediately
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      
      toast.success("Accès au microphone accordé");
      return true;
      
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      
      if (error.name === 'NotAllowedError') {
        toast.error("Accès microphone refusé. Activez-le dans les paramètres de votre navigateur.");
      } else if (error.name === 'NotFoundError') {
        toast.error("Aucun microphone détecté sur cet appareil.");
      } else {
        toast.error("Impossible d'accéder au microphone.");
      }
      
      return false;
    }
  }, []);

  return {
    permissions,
    requestCameraPermission,
    requestMicrophonePermission
  };
}