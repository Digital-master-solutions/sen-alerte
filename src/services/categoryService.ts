import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  nom: string;
  usage_count?: number;
}

export interface CategoryWithUsage extends Category {
  usage_count: number;
}

export class CategoryService {
  /**
   * Récupère toutes les catégories avec leur nombre d'utilisations
   */
  static async getAllCategories(): Promise<CategoryWithUsage[]> {
    try {
      // Récupérer toutes les catégories
      const { data: categories, error: categoriesError } = await supabase
        .from("categorie")
        .select("*")
        .order("nom", { ascending: true });

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        throw new Error(`Erreur lors de la récupération des catégories: ${categoriesError.message}`);
      }

      // Compter les utilisations pour chaque catégorie
      const categoriesWithUsage = await Promise.all(
        (categories || []).map(async (category) => {
          const { count, error: countError } = await supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("type", category.nom);

          if (countError) {
            console.error(`Error counting reports for category ${category.nom}:`, countError);
            return { ...category, usage_count: 0 };
          }

          return { ...category, usage_count: count || 0 };
        })
      );

      return categoriesWithUsage;
    } catch (error) {
      console.error("CategoryService.getAllCategories error:", error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle catégorie
   */
  static async createCategory(nom: string): Promise<Category> {
    try {
      // Vérifier si la catégorie existe déjà
      const { data: existingCategory, error: checkError } = await supabase
        .from("categorie")
        .select("id")
        .eq("nom", nom.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
      }

      if (existingCategory) {
        throw new Error("Une catégorie avec ce nom existe déjà");
      }

      // Créer la nouvelle catégorie
      const { data, error } = await supabase
        .from("categorie")
        .insert({ nom: nom.trim() })
        .select()
        .single();

      if (error) {
        console.error("Error creating category:", error);
        throw new Error(`Erreur lors de la création: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("CategoryService.createCategory error:", error);
      throw error;
    }
  }

  /**
   * Met à jour une catégorie existante
   */
  static async updateCategory(id: string, nom: string): Promise<Category> {
    try {
      // Vérifier si une autre catégorie avec ce nom existe déjà
      const { data: existingCategory, error: checkError } = await supabase
        .from("categorie")
        .select("id")
        .eq("nom", nom.trim())
        .neq("id", id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Erreur lors de la vérification: ${checkError.message}`);
      }

      if (existingCategory) {
        throw new Error("Une autre catégorie avec ce nom existe déjà");
      }

      // Mettre à jour la catégorie
      const { data, error } = await supabase
        .from("categorie")
        .update({ nom: nom.trim() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating category:", error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("CategoryService.updateCategory error:", error);
      throw error;
    }
  }

  /**
   * Supprime une catégorie (avec suppression en cascade des associations)
   */
  static async deleteCategory(id: string): Promise<void> {
    try {
      console.log("CategoryService.deleteCategory - Début suppression catégorie:", id);
      
      // D'abord, supprimer toutes les associations avec les organisations (si elles existent)
      console.log("Suppression des associations categorie_organization...");
      const { error: deleteAssociationsError } = await supabase
        .from("categorie_organization")
        .delete()
        .eq("categorie_id", id);

      if (deleteAssociationsError) {
        console.error("Error deleting category-organization associations:", deleteAssociationsError);
        // Ne pas arrêter si les associations n'existent pas
        if (deleteAssociationsError.code !== 'PGRST116') {
          throw new Error(`Erreur lors de la suppression des associations: ${deleteAssociationsError.message}`);
        }
      }
      console.log("Associations supprimées avec succès (ou n'existaient pas)");

      // Ensuite, supprimer la catégorie
      console.log("Suppression de la catégorie...");
      const { data, error } = await supabase
        .from("categorie")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error deleting category:", error);
        throw new Error(`Erreur lors de la suppression de la catégorie: ${error.message}`);
      }

      // Vérifier que la catégorie a bien été supprimée
      if (!data || data.length === 0) {
        throw new Error("La catégorie n'a pas été trouvée ou n'a pas pu être supprimée");
      }

      console.log("Catégorie supprimée avec succès:", data[0]);
    } catch (error) {
      console.error("CategoryService.deleteCategory error:", error);
      throw error;
    }
  }

  /**
   * Vérifie si une catégorie peut être supprimée
   * Maintenant toutes les catégories peuvent être supprimées (suppression en cascade)
   */
  static async canDeleteCategory(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      // Vérifier s'il y a des associations pour informer l'utilisateur
      const { data: categorieOrganizationData, error: checkError } = await supabase
        .from("categorie_organization")
        .select("categorie_id")
        .eq("categorie_id", id);

      if (checkError) {
        console.error("Error checking foreign key constraints:", checkError);
        return { canDelete: true, reason: "Erreur lors de la vérification, mais suppression possible" };
      }

      if (categorieOrganizationData && categorieOrganizationData.length > 0) {
        return { 
          canDelete: true, 
          reason: `Cette catégorie est liée à ${categorieOrganizationData.length} organisation(s). Les associations seront supprimées.` 
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error("CategoryService.canDeleteCategory error:", error);
      return { canDelete: true, reason: "Erreur lors de la vérification, mais suppression possible" };
    }
  }

  /**
   * Récupère les organisations liées à une catégorie
   */
  static async getCategoryOrganizations(categoryId: string) {
    try {
      const { data, error } = await supabase
        .from("categorie_organization")
        .select(`
          organization_id,
          organizations (
            id,
            name,
            type
          )
        `)
        .eq("categorie_id", categoryId);

      if (error) {
        console.error("Error fetching category organizations:", error);
        throw new Error(`Erreur lors de la récupération des organisations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("CategoryService.getCategoryOrganizations error:", error);
      throw error;
    }
  }
}
