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
          .eq('department', 'Dakar')
          .order('created_at', { ascending: false })
          .limit(6);

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
      <section className="py-12 bg-secondary/20">
        <div className="container">
          <div className="text-center">
            <p className="text-muted-foreground">Chargement des incidents...</p>
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
            <h2 className="text-2xl font-bold text-foreground">Aucun incident signalé dans le département de Dakar</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Soyez le premier à signaler un problème !
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-secondary/20">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Incidents récents dans votre zone
          </h2>
          <p className="text-muted-foreground">
            Département de Dakar • {reports.length} signalement{reports.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {report.type}
                  </CardTitle>
                  <Badge className={`text-white ${getStatusColor(report.status)}`}>
                    {getStatusText(report.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {report.description}
                </p>
                
                {report.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{report.address}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(report.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
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