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

export const useManagedReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async (organizationId: string) => {
    setLoading(true);
    try {
      console.log("Loading managed reports for organization:", organizationId);
      
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("assigned_organization_id", organizationId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      console.log("Loaded managed reports:", data?.length || 0);
      setReports(data || []);
    } catch (error: any) {
      console.error("Error loading managed reports:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);
      
      if (error) throw error;
      
      toast({ 
        title: "Statut mis à jour", 
        description: `Signalement marqué comme ${newStatus}` 
      });
      
      // Mettre à jour localement
      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus }
            : report
        )
      );
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    }
  };

  const addReport = (report: Report) => {
    console.log("Adding report to managed list:", report.id);
    setReports(prev => {
      // Éviter les doublons
      const exists = prev.find(r => r.id === report.id);
      if (exists) {
        console.log("Report already in managed list, updating");
        return prev.map(r => r.id === report.id ? report : r);
      }
      console.log("Adding new report to managed list");
      return [report, ...prev];
    });
  };

  return {
    reports,
    loading,
    loadReports,
    updateStatus,
    addReport
  };
};