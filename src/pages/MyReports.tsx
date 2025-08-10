import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, ArrowLeft, Search, Filter, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  address?: string;
  anonymous_code?: string;
  photo_url?: string;
}

const MyReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    document.title = "Mes signalements · SenAlert";
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reports:', error);
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolu':
        return 'bg-green-500 hover:bg-green-600';
      case 'en-cours':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'en-attente':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolu':
        return 'Résolu';
      case 'en-cours':
        return 'En cours';
      case 'en-attente':
        return 'En attente';
      default:
        return status;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchCode || 
      (report.anonymous_code && report.anonymous_code.toLowerCase().includes(searchCode.toLowerCase())) ||
      report.type.toLowerCase().includes(searchCode.toLowerCase()) ||
      report.description.toLowerCase().includes(searchCode.toLowerCase());
    
    const matchesFilter = filter === 'all' || report.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background border-b">
          <div className="container py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Mes signalements</h1>
                <p className="text-muted-foreground">Suivi de vos signalements</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Chargement des signalements...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mes signalements</h1>
              <p className="text-muted-foreground">Gérez et suivez vos signalements</p>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code de suivi, type ou description..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tous
              </Button>
              <Button
                variant={filter === 'en-attente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('en-attente')}
              >
                En attente
              </Button>
              <Button
                variant={filter === 'en-cours' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('en-cours')}
              >
                En cours
              </Button>
              <Button
                variant={filter === 'resolu' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('resolu')}
              >
                Résolus
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {searchCode || filter !== 'all' ? 'Aucun signalement trouvé' : 'Aucun signalement'}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {searchCode || filter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche ou filtres.'
                : 'Vous n\'avez pas encore fait de signalement. Commencez par signaler un problème dans votre quartier.'
              }
            </p>
            {!searchCode && filter === 'all' && (
              <Button onClick={() => navigate("/signaler")}>
                Faire un signalement
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                {filteredReports.length} signalement{filteredReports.length > 1 ? 's' : ''} trouvé{filteredReports.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-foreground mb-2">
                          {report.type}
                        </CardTitle>
                        {report.anonymous_code && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Code de suivi:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {report.anonymous_code}
                            </code>
                          </div>
                        )}
                      </div>
                      <Badge className={`text-white font-medium ${getStatusColor(report.status)}`}>
                        {getStatusText(report.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {report.description}
                    </p>

                    {report.photo_url && (
                      <div className="rounded-lg overflow-hidden">
                        <img 
                          src={report.photo_url} 
                          alt="Photo du signalement" 
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
                      {report.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{report.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {new Date(report.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MyReports;