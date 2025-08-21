import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Clock, User, Hand } from "lucide-react";
import { getStatusBadge } from "./getStatusBadge";
import { ReportDetailsDialog } from "./ReportDetailsDialog";
import { useState, useEffect } from "react";

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  address: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  audio_url?: string;
  anonymous_code?: string;
  assigned_organization_id?: string;
}

interface ReportCardProps {
  report: Report;
  type: "available" | "managed";
  onClaim?: (report: Report) => void;
  onStatusUpdate?: (reportId: string, newStatus: string) => void;
  onReportSelect: (report: Report) => void;
}

export function ReportCard({ report, type, onClaim, onStatusUpdate, onReportSelect }: ReportCardProps) {
  const [location, setLocation] = useState<string>("");

  useEffect(() => {
    const getLocation = async () => {
      if (report.address) {
        setLocation(report.address);
      } else if (report.department) {
        setLocation(report.department);
      } else if (report.latitude && report.longitude) {
        try {
          // Utiliser notre Edge Function pour éviter les problèmes CORS
          const response = await fetch(
            `https://mjhsvrksrmcemhbglfkm.supabase.co/functions/v1/geocode-reverse?lat=${report.latitude}&lon=${report.longitude}`
          );
          
          if (response.ok) {
            const data = await response.json();
            setLocation(data.location || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`);
          } else {
            // Fallback en cas d'erreur
            setLocation(`${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`);
          }
        } catch (error) {
          console.error("Erreur géocodage:", error);
          setLocation(`${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`);
        }
      } else {
        setLocation("Localisation non spécifiée");
      }
    };

    getLocation();
  }, [report.address, report.department, report.latitude, report.longitude]);
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-foreground">{report.type}</h3>
              {getStatusBadge(report.status)}
            </div>
            
            <p className="text-muted-foreground line-clamp-2">{report.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {location || "Chargement..."}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(report.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {report.anonymous_code || "Anonyme"}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ReportDetailsDialog 
              report={report} 
              onReportSelect={onReportSelect}
            />
            
            {type === "available" && onClaim && (() => {
              // Log détaillé pour debugging
              console.log(`ReportCard - Report ${report.id}:`);
              console.log("- assigned_organization_id:", report.assigned_organization_id);
              console.log("- type of assigned_organization_id:", typeof report.assigned_organization_id);
              console.log("- is null:", report.assigned_organization_id === null);
              console.log("- is undefined:", report.assigned_organization_id === undefined);
              console.log("- should show button:", !report.assigned_organization_id);
              
              // Vérifier que le rapport n'est vraiment pas assigné
              const isReallyAvailable = report.assigned_organization_id === null || report.assigned_organization_id === undefined;
              
              if (!isReallyAvailable) {
                console.warn(`Report ${report.id} appears to be assigned but is in available list`);
                return null;
              }
              
              return (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Hand className="h-4 w-4 mr-1" />
                      Gérer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la prise en charge</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir prendre en charge ce signalement "{report.type}" ? 
                        Une fois assigné, il ne sera plus disponible pour les autres organisations.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onClaim(report)}>
                        Confirmer la prise en charge
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            })()}

            {type === "managed" && onStatusUpdate && (
              <Select 
                value={report.status} 
                onValueChange={(newStatus) => onStatusUpdate(report.id, newStatus)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-attente">En attente</SelectItem>
                  <SelectItem value="en-cours">En cours</SelectItem>
                  <SelectItem value="resolu">Résolu</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}