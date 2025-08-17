import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
  const variants = {
    "en-attente": { color: "bg-admin-warning", text: "En attente" },
    "en-cours": { color: "bg-admin-info", text: "En cours" },
    "resolu": { color: "bg-admin-success", text: "Résolu" },
    "rejete": { color: "bg-red-500", text: "Rejeté" },
  };

  const variant = variants[status as keyof typeof variants] || variants["en-attente"];

  return (
    <Badge variant="secondary" className="gap-1">
      <div className={`w-2 h-2 rounded-full ${variant.color}`} />
      {variant.text}
    </Badge>
  );
};