import { WarningMessageInterface } from "../interfaces";

export const warningMessage:WarningMessageInterface = {
  // WARNING_ACCOUNT_DISABLED:"Le compte de l'utilisateur est désactivé. Il doit se reconnecter pour démarrer la procédure de réactivation du compte.",
  // WARNING__EMAIL:
  //   "Une erreur s'est produite lors de l'envoi de l'e-mail à l'adresse spécifiée. Veuillez vérifier l'adresse e-mail que vous avez fournie et assurez-vous qu'elle est correcte. Si l'adresse e-mail est correcte et que le problème persiste, cela peut être dû à un problème avec notre service d'envoi d'e-mails.",
  WARNING__REQUIRE_FIELD:
    "Certains champs requis sont manquants dans la requête. Veuillez vous assurer que tous les champs obligatoires sont présents dans les données soumises.",

  WARNING_INVALID_FIELD:
    "Le champ spécifié a été renseigné avec une valeur incorrecte ou invalide. Veuillez vérifier les données et réessayer avec des valeurs valides.",

  WARNING_INACTIVE_ACCOUNT:
    "Le compte de l'utilisateur n'est pas activé. Veuillez vous assurer que le processus d'activation du compte a été correctement suivi par l'utilisateur. Vérifiez également la validité du token d'activation et assurez-vous que l'e-mail d'activation a été envoyé avec succès.",

  WARNING_MANIPULATE_FIELD:
    "Tentative de manipulation de champ détectée. L'utilisateur a tenté de modifier ou d'ajouter un champ dans le formulaire.",

  WARNING_EMPTY_MODIFICATION:
    "Aucun champ spécifié pour la modification. La requête de modification a été reçue, mais aucun champ à modifier n'a été fourni.",

  WARNING_DUPLICATE_DOCUMENT:
    "Un document identique existe déjà dans la base de données. La requête d'insertion ou de mise à jour a été refusée car elle créerait un doublon avec un document déjà existant.",

  WARNING_ACCOUNT_BLOCKED:
    "L'accès au compte utilisateur a été temporairement suspendu en raison d'un nombre excessif de tentatives de connexion infructueuses. Le compte a été bloqué pour des raisons de sécurité.",

  WARNING_PAGE_NOT_FOUND:
    "La page ou la route demandée n'existe pas sur le serveur. Veuillez vérifier l'URL.",
  // WARNING_TOKEN:
  //   "Aucun token d'authentification valide n'a été trouvé. L'accès à cette ressource est interdit en raison d'un problème lié au token d'authentification. Cela peut être dû à l'absence de token, à un rôle utilisateur incorrect, à l'expiration du token, à un changement de mot de passe sans renouvellement du token ou à une modification de l'adresse e-mail sans renouvellement du token.",
  WARNING_DOCUMENT_NOT_FOUND: (field: string): string =>
    `Aucun(e) ${field} n'a été trouvé correspondant aux critères de recherche spécifiés.`,
};
