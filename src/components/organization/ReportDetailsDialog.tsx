import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { getStatusBadge } from "./getStatusBadge";

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

interface ReportDetailsDialogProps {
  report: Report;
  onReportSelect: (report: Report) => void;
}

export function ReportDetailsDialog({ report, onReportSelect }: ReportDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => onReportSelect(report)}>
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails du signalement</DialogTitle>
          <DialogDescription>Code: {report.anonymous_code}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Type:</strong> {report.type}
            </div>
            <div>
              <strong>Statut:</strong> {getStatusBadge(report.status)}
            </div>
          </div>
          <div>
            <strong>Description:</strong>
            <p className="mt-1">{report.description}</p>
          </div>
          {report.address && (
            <div>
              <strong>Adresse:</strong>
              <p className="mt-1">{report.address}</p>
            </div>
          )}
          {report.photo_url && (
            <div>
              <strong>Photo:</strong>
              <img
                src={report.photo_url}
                alt="Signalement"
                className="mt-1 rounded-lg max-h-48 object-cover"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}