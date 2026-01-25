import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, ArrowLeft, MessageCircle, CheckCircle, AlertCircle, Info, Eye } from 'lucide-react';
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

const MAX_PREVIEW_LENGTH = 150;

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authCode, setAuthCode] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    setSelectedNotification(null);
    setIsDialogOpen(false);
  };

  const openNotificationDialog = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
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
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">Succès</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700">Attention</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700">Erreur</Badge>;
      default:
        return <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700">Info</Badge>;
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Back button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={resetForm}
            className="mb-8 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Header */}
          <div className="bg-card rounded-3xl shadow-lg border border-border p-8 mb-8 text-center backdrop-blur-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Vos Notifications
            </h1>
            <p className="text-muted-foreground text-lg">
              Code: <span className="font-mono font-semibold text-primary">{authCode}</span> • {notifications.length} notification(s)
            </p>
          </div>

          {/* Notifications List */}
          <div className="space-y-6">
            {notifications.map((notification, index) => (
              <Card 
                key={notification.id} 
                className="bg-card shadow-lg border border-border hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-card shadow-sm">
                        {getTypeIcon(notification.type)}
                      </div>
                      <CardTitle className="text-xl font-semibold text-foreground leading-tight">
                        {notification.title}
                      </CardTitle>
                    </div>
                    {getTypeBadge(notification.type)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-muted-foreground text-sm mb-4">
                        Cliquez sur "Voir" pour lire le message complet
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-medium">
                          {formatDate(notification.created_at)}
                        </span>
                        {notification.read && (
                          <Badge variant="outline" className="text-xs border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Lu
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => openNotificationDialog(notification)}
                      className="ml-4 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-12 text-center">
            <Button
              onClick={resetForm}
              variant="outline"
              className="px-8 py-3 text-lg font-medium bg-card hover:bg-muted border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              Saisir un autre code
            </Button>
          </div>
        </div>

        {/* Notification Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedNotification && (
              <>
                <DialogHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted">
                      {getTypeIcon(selectedNotification.type)}
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl font-semibold text-foreground leading-tight">
                        {selectedNotification.title}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getTypeBadge(selectedNotification.type)}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(selectedNotification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="mt-6">
                  <div className="prose max-w-none">
                    <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                      {selectedNotification.message}
                    </p>
                  </div>
                  
                  {selectedNotification.read && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <Badge variant="outline" className="border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Message lu
                      </Badge>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Phone className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Mes Notifications
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-8">
            Entrez votre code d'authentification pour accéder à vos notifications
          </p>

          {/* Form */}
          <div className="space-y-6">
            <div className="text-left">
              <label htmlFor="auth-code-input" className="block text-sm font-medium text-foreground mb-2">
                Code d'authentification
              </label>
              <Input
                id="auth-code-input"
                type="text"
                value={authCode}
                onChange={handleAuthCodeChange}
                placeholder="EX: A2B4C8D9"
                className="text-center text-lg font-mono tracking-wider border-2 border-border rounded-lg h-12"
                maxLength={8}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Format: 8 caractères alphanumériques (ex: A2B4C8D9)
              </p>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {error}
                </p>
              )}
            </div>

            <Button
              onClick={handleContinue}
              disabled={authCode.length !== 8 || loading}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : 'Continuer'}
            </Button>
          </div>

          {/* Footer link */}
          <div className="mt-8 pt-6">
            <p className="text-muted-foreground">
              Vous n'avez pas de code ?{' '}
              <button
                onClick={() => navigate('/signaler')}
                className="text-primary hover:text-primary/80 font-medium"
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