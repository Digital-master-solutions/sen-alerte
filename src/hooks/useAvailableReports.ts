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
  latitude?: number;
  longitude?: number;
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
      console.log("Loading available reports for organization:", organization.id);
      
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .is("assigned_organization_id", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      console.log("Loaded available reports:", data?.length || 0);
      console.log("Sample report data:", data?.[0]);
      
      // Log détaillé des assignations pour debugging
      data?.forEach((report, index) => {
        if (index < 3) { // Log seulement les 3 premiers pour éviter le spam
          console.log(`Report ${report.id}: assigned_organization_id =`, report.assigned_organization_id, typeof report.assigned_organization_id);
        }
      });
      
      setReports(data || []);
    } catch (error: any) {
      console.error("Error loading available reports:", error);
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
      console.log("=== CLAIMING REPORT PROCESS START ===");
      console.log("Report ID:", report.id);
      console.log("Organization ID:", organization.id);
      console.log("Report current assigned_organization_id:", report.assigned_organization_id);
      console.log("Type of assigned_organization_id:", typeof report.assigned_organization_id);
      console.log("Is null?", report.assigned_organization_id === null);
      console.log("Is undefined?", report.assigned_organization_id === undefined);
      
      // Vérification préalable de l'état du rapport
      const { data: currentReport, error: checkError } = await supabase
        .from("reports")
        .select("assigned_organization_id, status")
        .eq("id", report.id)
        .single();
        
      if (checkError) {
        console.error("Error checking current report state:", checkError);
        throw checkError;
      }
      
      console.log("Current report state in DB:", currentReport);
      
      if (currentReport.assigned_organization_id !== null) {
        console.warn("Report is already assigned in database:", currentReport.assigned_organization_id);
        toast({ 
          variant: "destructive", 
          title: "Signalement déjà assigné", 
          description: "Ce signalement a déjà été pris en charge par une autre organisation" 
        });
        // Retirer le signalement de la liste car il n'est plus disponible
        setReports(prev => prev.filter(r => r.id !== report.id));
        return null;
      }
      
      console.log("Report is available, proceeding with claim...");
      
      // Mettre à jour le signalement avec une condition stricte
      const { data: updatedReports, error } = await supabase
        .from("reports")
        .update({ 
          assigned_organization_id: organization.id,
          status: 'en-cours',
          updated_at: new Date().toISOString()
        })
        .eq("id", report.id)
        .is("assigned_organization_id", null) // Condition stricte pour éviter les conflits
        .select();
      
      if (error) {
        console.error("Database update error:", error);
        console.log("Error details:", error.details, error.hint, error.code);
        throw error;
      }
      
      console.log("Update query result:", updatedReports);
      
      // Vérifier si l'update a réussi
      if (!updatedReports || updatedReports.length === 0) {
        console.warn("No rows were updated - report may have been claimed by another organization");
        toast({ 
          variant: "destructive", 
          title: "Signalement déjà assigné", 
          description: "Ce signalement a été pris en charge par une autre organisation entre-temps" 
        });
        // Retirer le signalement de la liste car il n'est plus disponible
        setReports(prev => prev.filter(r => r.id !== report.id));
        return null;
      }
      
      const updatedReport = updatedReports[0];
      console.log("Report successfully claimed:", updatedReport);
      console.log("=== CLAIMING REPORT PROCESS SUCCESS ===");
      
      toast({ 
        title: "Signalement pris en charge", 
        description: "Vous gérez maintenant ce signalement" 
      });
      
      // Retirer immédiatement le signalement de la liste disponible
      setReports(prev => prev.filter(r => r.id !== report.id));
      
      // Retourner le signalement mis à jour
      return updatedReport;
      
    } catch (error: any) {
      console.error("=== CLAIMING REPORT PROCESS FAILED ===");
      console.error("Error claiming report:", error);
      console.log("Error name:", error.name);
      console.log("Error message:", error.message);
      console.log("Error code:", error.code);
      console.log("Error details:", error.details);
      
      let errorMessage = "Impossible de prendre en charge ce signalement";
      
      if (error.code === "42501") {
        errorMessage = "Permissions insuffisantes pour prendre en charge ce signalement";
      } else if (error.message?.includes("violates row-level security")) {
        errorMessage = "Sécurité : impossible de modifier ce signalement";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: errorMessage
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