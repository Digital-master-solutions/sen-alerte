import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { SignupData } from "../OrganizationSignupStepper";
import { Loader2, X } from "lucide-react";

interface CategorySelectorProps {
  data: SignupData;
  updateData: (data: Partial<SignupData>) => void;
  isValid: boolean;
}

interface Category {
  id: string;
  nom: string;
}

export function CategorySelector({ data, updateData }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('categorie')
        .select('*')
        .order('nom');

      if (error) throw error;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const currentCategories = data.selectedCategories;
    const isSelected = currentCategories.includes(categoryId);
    
    const newCategories = isSelected
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    updateData({ selectedCategories: newCategories });
  };

  const removeCategory = (categoryId: string) => {
    const newCategories = data.selectedCategories.filter(id => id !== categoryId);
    updateData({ selectedCategories: newCategories });
  };

  const getSelectedCategoryNames = () => {
    return categories
      .filter(cat => data.selectedCategories.includes(cat.id))
      .map(cat => cat.nom);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Chargement des catégories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Catégories gérées</h3>
        <p className="text-muted-foreground">
          Quels types de signalements votre organisation peut-elle traiter ?
        </p>
      </div>

      {/* Catégories sélectionnées */}
      {data.selectedCategories.length > 0 && (
        <div className="space-y-2">
          <Label>Catégories sélectionnées ({data.selectedCategories.length})</Label>
          <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg min-h-12">
            {getSelectedCategoryNames().map((categoryName, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="transition-all duration-200 hover:scale-105 cursor-pointer"
                onClick={() => {
                  const categoryId = categories.find(cat => cat.nom === categoryName)?.id;
                  if (categoryId) removeCategory(categoryId);
                }}
              >
                {categoryName}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Liste des catégories */}
      <div className="space-y-2">
        <Label>Catégories disponibles</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 hover:bg-muted/30 hover:scale-105 cursor-pointer"
              onClick={() => toggleCategory(category.id)}
            >
              <Checkbox
                id={category.id}
                checked={data.selectedCategories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              <Label
                htmlFor={category.id}
                className="flex-1 cursor-pointer font-medium"
              >
                {category.nom}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-accent/10 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Important :</strong> Sélectionnez au moins une catégorie. 
          Vous pourrez modifier ces préférences après validation de votre compte.
        </p>
      </div>

      {data.selectedCategories.length === 0 && (
        <div className="text-center text-destructive text-sm">
          ⚠️ Veuillez sélectionner au moins une catégorie pour continuer
        </div>
      )}
    </div>
  );
}