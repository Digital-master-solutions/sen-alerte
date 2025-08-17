import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  address: string;
  photo_url?: string;
  audio_url?: string;
  anonymous_code?: string;
  assigned_organization_id?: string;
}

interface Organization {
  id: string;
  name: string;
  email: string;
}

export const useAvailableReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async (organization: Organization) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .is("assigned_organization_id", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const claimReport = async (report: Report, organization: Organization) => {
    try {
      console.log("Attempting to claim report:", report.id, "for organization:", organization.id);
      
      // Utiliser une approche plus simple - essayer directement l'update
      const { data: updatedReports, error } = await supabase
        .from("reports")
        .update({ 
          assigned_organization_id: organization.id,
          status: 'en-cours',
          updated_at: new Date().toISOString()
        })
        .eq("id", report.id)
        .is("assigned_organization_id", null)
        .select();
      
      if (error) {
        console.error("Database update error:", error);
        throw error;
      }
      
      // Vérifier si l'update a affecté au moins une ligne
      if (!updatedReports || updatedReports.length === 0) {
        console.warn("No rows were updated - report may already be assigned");
        toast({ 
          variant: "destructive", 
          title: "Signalement déjà assigné", 
          description: "Ce signalement a déjà été pris en charge par une autre organisation" 
        });
        // Retirer le signalement de la liste car il n'est plus disponible
        setReports(prev => prev.filter(r => r.id !== report.id));
        return null;
      }
      
      const updatedReport = updatedReports[0];
      console.log("Report successfully claimed:", updatedReport);
      
      toast({ 
        title: "Signalement pris en charge", 
        description: "Vous gérez maintenant ce signalement" 
      });
      
      // Retirer immédiatement le signalement de la liste disponible
      setReports(prev => prev.filter(r => r.id !== report.id));
      
      // Retourner le signalement mis à jour depuis la base
      return updatedReport;
      
    } catch (error: any) {
      console.error("Error claiming report:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message || "Impossible de prendre en charge ce signalement" 
      });
      return null;
    }
  };

  return {
    reports,
    loading,
    loadReports,
    claimReport
  };
};