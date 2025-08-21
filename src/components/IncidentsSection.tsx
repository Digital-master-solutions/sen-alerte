import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, AlertCircle } from 'lucide-react';

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  address?: string;
  department?: string;
}

const IncidentsSection = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('id, type, description, status, created_at, address, department')
          .order('created_at', { ascending: false })
          .limit(5);

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

    loadReports();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolu':
        return 'bg-green-500';
      case 'en-cours':
        return 'bg-yellow-500';
      case 'en-attente':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-primary" />
              <h2 className="text-4xl font-bold text-foreground">
                Incidents récents
              </h2>
            </div>
            <p className="text-xl text-muted-foreground">
              Chargement des signalements...
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="bg-white border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reports.length === 0) {
    return (
      <section className="py-12 bg-secondary/20">
        <div className="container">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Aucun incident signalé</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Soyez le premier à signaler un problème !
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertCircle className="h-8 w-8 text-primary" />
            <h2 className="text-4xl font-bold text-foreground">
              Incidents récents
            </h2>
          </div>
          <p className="text-xl text-muted-foreground">
            {reports.length} signalement{reports.length > 1 ? 's' : ''} récent{reports.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reports.map((report) => (
            <Card key={report.id} className="bg-white hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-105">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <AlertCircle className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground leading-tight">
                      {report.type}
                    </CardTitle>
                  </div>
                  <Badge className={`text-white font-medium px-3 py-1 ${getStatusColor(report.status)}`}>
                    {getStatusText(report.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                  {report.description}
                </p>
                
                <div className="space-y-2">
                  {report.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{report.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {new Date(report.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IncidentsSection;