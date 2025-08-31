// Messages d'erreur d'authentification
export const AUTH_ERROR_MESSAGES = {
  // Erreurs générales
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
  INVALID_ADMIN_CREDENTIALS: "Nom d'utilisateur ou mot de passe incorrect",
  NETWORK_ERROR: "Erreur de connexion. Vérifiez votre connexion internet.",
  UNKNOWN_ERROR: "Une erreur inattendue s'est produite. Veuillez réessayer.",
  
  // Erreurs spécifiques aux organisations
  ORG_NOT_APPROVED: "Votre compte n'est pas encore approuvé. Veuillez contacter l'administrateur.",
  ORG_DISABLED: "Votre compte a été désactivé. Veuillez contacter l'administrateur.",
  ORG_NOT_FOUND: "Aucune organisation trouvée avec cette adresse email.",
  
  // Erreurs spécifiques aux administrateurs
  ADMIN_DISABLED: "Votre compte administrateur a été désactivé. Veuillez contacter le support.",
  ADMIN_INACTIVE: "Votre compte administrateur est inactif. Veuillez contacter le support.",
  ADMIN_NOT_FOUND: "Aucun administrateur trouvé avec ce nom d'utilisateur.",
  
  // Erreurs de session
  SESSION_EXPIRED: "Votre session a expiré. Veuillez vous reconnecter.",
  TOKEN_INVALID: "Token d'authentification invalide. Veuillez vous reconnecter.",
  TOKEN_EXPIRED: "Token d'authentification expiré. Veuillez vous reconnecter.",
} as const;

// Messages de succès d'authentification
export const AUTH_SUCCESS_MESSAGES = {
  // Messages de connexion réussie
  LOGIN_SUCCESS_ORG: (name: string) => `Bienvenue ${name} !`,
  LOGIN_SUCCESS_ADMIN: (name: string) => `Bienvenue ${name} ! Vous êtes connecté en tant qu'administrateur.`,
  LOGIN_SUCCESS_GENERIC: "Connexion réussie",
  
  // Messages d'inscription
  SIGNUP_SUCCESS: "Inscription réussie ! Vous pouvez maintenant vous connecter.",
  SIGNUP_PENDING: "Inscription réussie ! Votre compte est en attente d'approbation.",
  
  // Messages de déconnexion
  LOGOUT_SUCCESS: "Déconnexion réussie",
  
  // Messages de récupération
  PASSWORD_RESET_SENT: "Un email de réinitialisation a été envoyé à votre adresse.",
  PASSWORD_RESET_SUCCESS: "Mot de passe mis à jour avec succès.",
} as const;

// Titres des messages d'erreur
export const AUTH_ERROR_TITLES = {
  LOGIN_ERROR: "Erreur de connexion",
  SIGNUP_ERROR: "Erreur d'inscription",
  ACCOUNT_PENDING: "Compte en attente d'approbation",
  ACCOUNT_DISABLED: "Compte désactivé",
  ACCOUNT_INACTIVE: "Compte inactif",
  ORGANIZATION_NOT_FOUND: "Organisation non trouvée",
  ADMIN_NOT_FOUND: "Administrateur non trouvé",
  SESSION_ERROR: "Erreur de session",
  NETWORK_ERROR: "Erreur de connexion",
  UNKNOWN_ERROR: "Erreur inattendue",
} as const;

// Fonctions utilitaires pour déterminer le type d'erreur
export const getAuthErrorInfo = (error: any) => {
  const message = error?.message || error?.toString() || '';
  
  // Erreurs d'organisation
  if (message.includes("n'est pas encore approuvé")) {
    return {
      title: AUTH_ERROR_TITLES.ACCOUNT_PENDING,
      description: AUTH_ERROR_MESSAGES.ORG_NOT_APPROVED
    };
  }
  
  if (message.includes("a été désactivé")) {
    return {
      title: AUTH_ERROR_TITLES.ACCOUNT_DISABLED,
      description: AUTH_ERROR_MESSAGES.ORG_DISABLED
    };
  }
  
  if (message.includes("Aucune organisation trouvée")) {
    return {
      title: AUTH_ERROR_TITLES.ORGANIZATION_NOT_FOUND,
      description: AUTH_ERROR_MESSAGES.ORG_NOT_FOUND
    };
  }
  
  // Erreurs d'administrateur
  if (message.includes("compte administrateur a été désactivé")) {
    return {
      title: AUTH_ERROR_TITLES.ACCOUNT_DISABLED,
      description: AUTH_ERROR_MESSAGES.ADMIN_DISABLED
    };
  }
  
  if (message.includes("compte administrateur est inactif")) {
    return {
      title: AUTH_ERROR_TITLES.ACCOUNT_INACTIVE,
      description: AUTH_ERROR_MESSAGES.ADMIN_INACTIVE
    };
  }
  
  // Erreurs de réseau
  if (message.includes("network") || message.includes("fetch")) {
    return {
      title: AUTH_ERROR_TITLES.NETWORK_ERROR,
      description: AUTH_ERROR_MESSAGES.NETWORK_ERROR
    };
  }
  
  // Erreur par défaut
  return {
    title: AUTH_ERROR_TITLES.LOGIN_ERROR,
    description: message || AUTH_ERROR_MESSAGES.UNKNOWN_ERROR
  };
};
