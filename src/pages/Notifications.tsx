import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, ArrowLeft, MessageCircle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  report_id: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authCode, setAuthCode] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    console.log('fetchNotifications called with code:', authCode);
    if (authCode.length !== 8) {
      console.log('Code length invalid:', authCode.length);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('anonymous_code', authCode)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('Aucune notification trouvée pour ce code.');
        return;
      }

      setNotifications(data);
      setShowNotifications(true);
      
      // Mark notifications as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('anonymous_code', authCode);

      toast({
        title: "Notifications récupérées",
        description: `${data.length} notification(s) trouvée(s).`,
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Erreur lors de la récupération des notifications.');
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les notifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    console.log('handleContinue clicked, authCode:', authCode, 'length:', authCode.length);
    fetchNotifications();
  };

  const resetForm = () => {
    setAuthCode('');
    setNotifications([]);
    setShowNotifications(false);
    setError('');
  };

  const handleAuthCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 8) {
      setAuthCode(value);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Succès</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Attention</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showNotifications) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Back button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={resetForm}
            className="mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Vos Notifications
            </h1>
            <p className="text-gray-600">
              Code: {authCode} • {notifications.length} notification(s)
            </p>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(notification.type)}
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                    </div>
                    {getTypeBadge(notification.type)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{formatDate(notification.created_at)}</span>
                    {notification.read && (
                      <Badge variant="outline" className="text-xs">
                        Lu
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-8 text-center">
            <Button
              onClick={resetForm}
              variant="outline"
              className="w-full max-w-md"
            >
              Saisir un autre code
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Phone className="h-10 w-10 text-blue-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Mes Notifications
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 mb-8">
            Entrez votre code d'authentification pour accéder à vos notifications
          </p>

          {/* Form */}
          <div className="space-y-6">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code d'authentification
              </label>
              <Input
                type="text"
                value={authCode}
                onChange={handleAuthCodeChange}
                placeholder="EX: A2B4C8D9"
                className="text-center text-lg font-mono tracking-wider border-2 border-gray-300 rounded-lg h-12"
                maxLength={8}
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Format: 8 caractères alphanumériques (ex: A2B4C8D9)
              </p>
              {error && (
                <p className="text-sm text-red-600 mt-2">
                  {error}
                </p>
              )}
            </div>

            <Button
              onClick={handleContinue}
              disabled={authCode.length !== 8 || loading}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : 'Continuer'}
            </Button>
          </div>

          {/* Footer link */}
          <div className="mt-8 pt-6">
            <p className="text-gray-600">
              Vous n'avez pas de code ?{' '}
              <button
                onClick={() => navigate('/signaler')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Faire un signalement
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;