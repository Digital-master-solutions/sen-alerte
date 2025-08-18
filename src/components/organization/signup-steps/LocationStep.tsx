import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignupData } from "../OrganizationSignupStepper";

interface LocationStepProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  isValid: boolean;
}

const SENEGAL_CITIES = [
  "Dakar",
  "Thiès",
  "Saint-Louis",
  "Kaolack",
  "Ziguinchor",
  "Diourbel",
  "Tambacounda",
  "Fatick",
  "Kolda",
  "Louga",
  "Matam",
  "Kaffrine",
  "Kédougou",
  "Sédhiou"
];

export function LocationStep({ data, updateData }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Localisation</h3>
        <p className="text-muted-foreground">Où se situe votre organisation ?</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Adresse complète *</Label>
          <Input
            id="address"
            placeholder="Ex: Avenue Léopold Sédar Senghor, Plateau"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            className="transition-all duration-200 focus:scale-105"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville *</Label>
          <Select value={data.city} onValueChange={(value) => updateData({ city: value })}>
            <SelectTrigger className="transition-all duration-200 focus:scale-105">
              <SelectValue placeholder="Sélectionnez une ville" />
            </SelectTrigger>
            <SelectContent>
              {SENEGAL_CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Astuce :</strong> Une adresse précise aidera les citoyens à mieux identifier votre organisation.
        </p>
      </div>
    </div>
  );
}