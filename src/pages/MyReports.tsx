import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, ArrowLeft, FileText, CheckCircle, AlertCircle, Clock, MapPin, Eye, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  address?: string;
  department?: string;
  anonymous_name?: string;
  anonymous_phone?: string;
  resolution_notes?: string;
  photo_url?: string;
  audio_url?: string;
}

const MyReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authCode, setAuthCode] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchReports = async () => {
    if (authCode.length !== 8) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('anonymous_code', authCode)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('Aucun signalement trouvé pour ce code.');
        return;
      }

      setReports(data);
      setShowReports(true);
      
      toast({
        title: "Signalements récupérés",
        description: `${data.length} signalement(s) trouvé(s).`,
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Erreur lors de la récupération des signalements.');
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les signalements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    fetchReports();
  };

  const resetForm = () => {
    setAuthCode('');
    setReports([]);
    setShowReports(false);
    setError('');
    setSelectedReport(null);
    setIsDialogOpen(false);
  };

  const openReportDialog = (report: Report) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
  };

  const handleAuthCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 8) {
      setAuthCode(value);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolu':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'en-cours':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'en-attente':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolu':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">Résolu</Badge>;
      case 'en-cours':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">En cours</Badge>;
      case 'en-attente':
        return <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">En attente</Badge>;
      default:
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Inconnu</Badge>;
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

  if (showReports) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Back button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={resetForm}
            className="mb-8 hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200/50 p-8 mb-8 text-center backdrop-blur-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileText className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Mes Signalements
            </h1>
            <p className="text-slate-600 text-lg">
              Code: <span className="font-mono font-semibold text-blue-600">{authCode}</span> • {reports.length} signalement(s)
            </p>
          </div>

          {/* Reports List */}
          <div className="space-y-6">
            {reports.map((report, index) => (
              <Card 
                key={report.id} 
                className="bg-white shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-white shadow-sm">
                        {getStatusIcon(report.status)}
                      </div>
                      <CardTitle className="text-xl font-semibold text-slate-900 leading-tight">
                        {report.type}
                      </CardTitle>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {report.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        {report.address && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{report.address}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>Signalé le {formatDate(report.created_at)}</span>
                        </div>

                        {report.anonymous_name && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <User className="h-4 w-4 flex-shrink-0" />
                            <span>{report.anonymous_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => openReportDialog(report)}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
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
              className="px-8 py-3 text-lg font-medium bg-white hover:bg-slate-50 border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              Saisir un autre code
            </Button>
          </div>
        </div>

        {/* Report Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedReport && (
              <>
                <DialogHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100">
                      {getStatusIcon(selectedReport.status)}
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl font-semibold text-slate-900 leading-tight">
                        {selectedReport.type}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(selectedReport.status)}
                        <span className="text-sm text-slate-500">
                          Signalé le {formatDate(selectedReport.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.description}
                    </p>
                  </div>

                  {selectedReport.address && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Localisation</h4>
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedReport.address}</span>
                      </div>
                    </div>
                  )}

                  {selectedReport.resolution_notes && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Notes de résolution</h4>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedReport.resolution_notes}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <span className="text-sm text-slate-500">Signalé le</span>
                      <p className="font-medium text-slate-900">{formatDate(selectedReport.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500">Dernière mise à jour</span>
                      <p className="font-medium text-slate-900">{formatDate(selectedReport.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
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
            Mes Signalements
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 mb-8">
            Entrez votre code d'authentification pour voir vos signalements
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

export default MyReports;