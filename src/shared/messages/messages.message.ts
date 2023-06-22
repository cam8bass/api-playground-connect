import MessagesInterface from "../interfaces/messages.interface";

export const AppMessage: MessagesInterface = {
  errorMessage: {
    ERROR_NO_SEARCH_RESULTS:
      "Désolé, aucune correspondance n'a été trouvée pour votre recherche.",

    ERROR_EMPTY_LOGIN: "Veuillez entrer vos identifiants de connexion.",

    ERROR_ACCOUNT_LOCKED:
      "Suite à un nombre important de tentatives de connexion erronées, votre compte a été bloqué pendant 1 heure. Si vous n'êtes pas à l'origine de ce blocage, nous vous conseillons de réinitialiser vos identifiants de connexion.",

    ERROR_LOGIN_REQUIRED:
      "Veuillez vous connecter à votre compte pour accéder à cette page.",

    ERROR_ACCESS_DENIED:
      "Vous ne disposez pas des droits d'accès nécessaires pour accéder à cette page.",

    ERROR_SESSION_EXPIRED:
      "Votre session a expiré. Veuillez vous connecter à votre compte.",
    ERROR_REQUEST_EXPIRED: "Votre demande à expiré. Veuillez la renouveler",
    ERROR_SENT_EMAIL_ACTIVATION:
      "Une erreur est survenue lors de l'envoi de l'e-mail d'activation du compte. Veuillez vous rendre sur la page de connexion et tenter de vous connecter à nouveau pour générer un nouvel e-mail d'activation. Si le problème persiste, veuillez contacter l'équipe de support.",
    ERROR_SENT_NOTIFICATION_DELETE_ACCOUNT:
      "Une erreur est survenue lors de l'envoi de l'e-mail de notification de suppression de compte. Cependant, la suppression du compte a bien été prise en compte.",
    ERROR_SENT_NOTIFICATION_ACTIVATION_ACCOUNT:
      "Une erreur est survenue lors de l'envoi de l'e-mail de notification de l'activation de votre compte. Cependant, la l'activation du compte a bien été prise en compte.",

    ERROR_SENT_EMAIL_RESET_PASSWORD:
      "Une erreur est survenue lors de l'envoi de l'e-mail réinitialisation de votre mot de passe. Veuillez réessayer ultérieurement. Si le problème persiste, veuillez contacter l'équipe de support.",
    ERROR_LINK_ACTIVATION_EXPIRED:
      "Une erreur est survenue. Le lien d'activation a expiré. Veuillez retourner à la page de connexion et essayer de vous connecter avec vos identifiants. Un nouveau lien d'activation vous sera envoyé.",
    ERROR_SENT_EMAIL_RESET_EMAIL:
      "Une erreur est survenue lors de l'envoi de l'e-mail changement de votre adresse email. Veuillez réessayer ultérieurement. Si le problème persiste, veuillez contacter l'équipe de support.",
    ERROR_SENT_EMAIL_DISABLE_ACCOUNT:
      "Une erreur est survenue lors de l'envoi de l'e-mail de notification de désactivation de compte. Cependant, la désactivation de votre compte a bien été prise en compte.",
    ERROR_WRONG_PASSWORD: "Veuillez founir un mot de passe correct",
    ERROR_EMPTY_PASSWORD: "Veuillez entrer votre mot de passe actuel.",
    ERROR_WRONG_LOGIN: "Veuillez vérifier vos identifiants de connection",
    ERROR_EMPTY_EMAIL: "Veuillez entrer votre adresse email",
    ERROR_EMPTY_NEW_EMAIL: "Veuillez saisir votre nouvelle adresse e-mail.",
    ERROR_WRONG_EMAIL: "Veuillez vérifier votre adresse email",
    ERROR_WRONG_PASSWORD_ROUTE:
      "Pour modifier votre mot de passe, veuillez vous rediriger vers la section prévu à cet effet.",
  },

  successMessage: {
    SUCCESS_DOCUMENT_DELETED: (id: string): string =>
      `Le document ${id} a été supprimé avec succès.`,
    SUCCESS_FIELDS_MODIFIED: (fields: object): string =>
      `Vous avez effectué des modifications sur les champs ${fields}`,
    SUCCESS_SENT_EMAIL_ACTIVATION: (userEmail: string): string =>
      `Un email de confirmation concernant l'activation de votre compte a été envoyé à ${userEmail}. Veuillez vérifier votre boîte de réception.`,
    SUCCESS_ACTIVATION_ACCOUNT: "Votre compte a été activé avec succès.",
    SUCCESS_SENT_EMAIL_RESET_PASSWORD: (userEmail: string): string =>
      `Un email de confirmation concernant la réinitialisation de votre mot de passe a été envoyé à ${userEmail}. Veuillez vérifier votre boîte de réception.`,
    SUCCESS_SENT_EMAIL_RESET_EMAIL: (userEmail: string): string =>
      `Un email de confirmation concernant la changement de votre adresse email a été envoyé à ${userEmail}. Veuillez vérifier votre boîte de réception.`,
    SUCCESS_PASSWORD_MODIFIED: "Votre mot de passe a été modifié avec succès.",
    SUCCESS_EMAIL_MODIFIED: "Votre adresse e-mail a été modifiée avec succès.",
    SUCCESS_SENT_EMAIL_DISABLE_ACCOUNT: (userEmail: string): string =>
      `Votre compte a été désactivé avec succès. Un email de notification a été envoyé à ${userEmail}. Veuillez vérifier votre boîte de réception.`,
  },

  validationMessage: {
    VALIDATE_REQUIRED_FIELD: (fieldName: string): string =>
      `Le champ ${fieldName} est obligatoire`,
    VALIDATE_MIN_LENGTH: (fieldName: string, min: number): string =>
      `Le champ ${fieldName} doit contenir au minimum ${min} caractères`,
    VALIDATE_MAX_LENGTH: (fieldName: string, max: number): string =>
      `Le champ ${fieldName} doit contenir au maximum ${max} caractères`,
    VALIDATE_ONLY_STRING: (fieldName: string): string =>
      `Le champ ${fieldName} doit comporter uniquement des lettres`,
    VALIDATE_UNIQUE_FIELD: (fieldName: string): string =>
      `${fieldName} est déjà utilisée`,
    VALIDATE_PASSWORD: (numCharacters: number): string =>
      ` Le champ mot de passe doit contenir au minimum une lettre minuscule, une majuscule, un chiffre, un caractère spécial et avoir une longueur minimale de ${numCharacters} caractères.`,
    VALIDATE_PASSWORD_CONFIRM:
      "Le mot de passe de confirmation doit être identique a votre mot de passe",
    VALIDATE_EMPTY_VALUE: (fieldName: string): string =>
      `Veuillez saisir votre: ${fieldName}`,
    VALIDATE_EMAIL: "Veuillez saisir une adresse email valide",
  },
};
