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
      // Vérifier d'abord que le signalement n'est pas déjà assigné
      const { data: currentReport, error: fetchError } = await supabase
        .from("reports")
        .select("assigned_organization_id")
        .eq("id", report.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (currentReport.assigned_organization_id) {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: "Ce signalement est déjà assigné à une organisation" 
        });
        // Retirer le signalement de la liste car il est déjà assigné
        setReports(prev => prev.filter(r => r.id !== report.id));
        return null;
      }
      
      // Utiliser une transaction pour s'assurer de la cohérence
      const { data: updatedReport, error } = await supabase
        .from("reports")
        .update({ 
          assigned_organization_id: organization.id,
          status: 'en-cours',
          updated_at: new Date().toISOString()
        })
        .eq("id", report.id)
        .is("assigned_organization_id", null)
        .select()
        .single();
      
      if (error) {
        console.error("Database update error:", error);
        throw error;
      }
      
      if (!updatedReport) {
        throw new Error("Le signalement n'a pas pu être mis à jour");
      }
      
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