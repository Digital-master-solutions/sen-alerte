import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignupData } from "../OrganizationSignupStepper";

interface BasicInfoStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  isValid: boolean;
}

const ORGANIZATION_TYPES = [
  "Mairie",
  "Conseil départemental",
  "Préfecture",
  "Services publics",
  "Entreprise de service",
  "ONG",
  "Association",
  "Autre"
];

export function BasicInfoStep({ data, updateData }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Informations de base</h3>
        <p className="text-muted-foreground">Présentez votre organisation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nom de l'organisation *</Label>
          <Input
            id="name"
            placeholder="Ex: Mairie de Dakar"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className="transition-all duration-200 focus:scale-105"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type d'organisation *</Label>
          <Select value={data.type} onValueChange={(value) => updateData({ type: value })}>
            <SelectTrigger className="transition-all duration-200 focus:scale-105">
              <SelectValue placeholder="Sélectionnez le type" />
            </SelectTrigger>
            <SelectContent>
              {ORGANIZATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel *</Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@organisation.sn"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            className="transition-all duration-200 focus:scale-105"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+221 33 XXX XX XX"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            className="transition-all duration-200 focus:scale-105"
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        * Champs obligatoires
      </div>
    </div>
  );
}