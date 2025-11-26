import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, AlertCircle } from 'lucide-react';
import { useMobileOptimization } from '@/hooks/use-mobile';

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
  const { isMobile, mobileClasses } = useMobileOptimization();

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
      <section className={`${isMobile ? 'py-8' : 'py-16'} bg-secondary/20`}>
        <div className={`container ${mobileClasses.container}`}>
          <div className={`text-center ${isMobile ? 'mb-6' : 'mb-12'}`}>
            <div className={`flex items-center justify-center ${isMobile ? 'gap-2 mb-3' : 'gap-3 mb-4'}`}>
              <AlertCircle className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-primary`} />
              <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-foreground`}>
                Incidents récents
              </h2>
            </div>
            <p className={`${isMobile ? 'text-base' : 'text-xl'} text-muted-foreground`}>
              Chargement des signalements...
            </p>
          </div>

          <div className={`grid ${mobileClasses.grid}`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className={`bg-white/90 backdrop-blur-sm border-0 shadow-md ${mobileClasses.card}`}>
                <CardHeader className={isMobile ? 'pb-2' : 'pb-4'}>
                  <div className={`flex items-start justify-between ${isMobile ? 'gap-2' : 'gap-3'}`}>
                    <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                      <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-primary/10`}>
                        <div className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} bg-muted animate-pulse rounded`} />
                      </div>
                      <div className={`${isMobile ? 'h-5 w-24' : 'h-6 w-32'} bg-muted animate-pulse rounded`} />
                    </div>
                    <div className={`${isMobile ? 'h-5 w-16' : 'h-6 w-20'} bg-muted animate-pulse rounded-full`} />
                  </div>
                </CardHeader>
                <CardContent className={mobileClasses.spacing}>
                  <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                  
                  <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
                    <div className="flex items-center gap-2">
                      <div className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} bg-muted animate-pulse rounded`} />
                      <div className={`${isMobile ? 'h-3.5 w-32' : 'h-4 w-40'} bg-muted animate-pulse rounded`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} bg-muted animate-pulse rounded`} />
                      <div className={`${isMobile ? 'h-3.5 w-20' : 'h-4 w-24'} bg-muted animate-pulse rounded`} />
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
      <section className={`${isMobile ? 'py-8' : 'py-12'} bg-secondary/20`}>
        <div className={`container ${mobileClasses.container}`}>
          <div className={`text-center ${mobileClasses.spacing}`}>
            <AlertCircle className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} text-muted-foreground mx-auto`} />
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>Aucun incident signalé</h2>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground max-w-md mx-auto`}>
              Soyez le premier à signaler un problème !
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${isMobile ? 'pt-6 pb-12' : 'pt-8 pb-16'} bg-secondary/20`}>
      <div className={`container ${mobileClasses.container}`}>
        <div className={`text-center ${isMobile ? 'mb-6' : 'mb-12'}`}>
          <div className={`flex items-center justify-center ${isMobile ? 'gap-2 mb-3' : 'gap-3 mb-4'}`}>
            <AlertCircle className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-primary`} />
            <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-foreground`}>
              Incidents récents
            </h2>
          </div>
          <p className={`${isMobile ? 'text-base' : 'text-xl'} text-muted-foreground`}>
            {reports.length} signalement{reports.length > 1 ? 's' : ''} récent{reports.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className={`grid ${mobileClasses.grid}`}>
          {reports.map((report) => (
            <Card key={report.id} className={`bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-0 shadow-md ${!isMobile && 'hover:scale-105'} ${mobileClasses.card}`}>
              <CardHeader className={isMobile ? 'pb-2' : 'pb-4'}>
                <div className={`flex items-start justify-between ${isMobile ? 'gap-2' : 'gap-3'}`}>
                  <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                    <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg bg-primary/10`}>
                      <AlertCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                    </div>
                    <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-foreground leading-tight`}>
                      {report.type}
                    </CardTitle>
                  </div>
                  <Badge className={`text-white font-medium ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'} ${getStatusColor(report.status)}`}>
                    {getStatusText(report.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className={mobileClasses.spacing}>
                <p className={`text-muted-foreground leading-relaxed line-clamp-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {report.description}
                </p>
                
                <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
                  {report.address && (
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                      <MapPin className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} flex-shrink-0`} />
                      <span className="truncate">{report.address}</span>
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    <Clock className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} flex-shrink-0`} />
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