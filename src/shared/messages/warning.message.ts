import { WarningMessageInterface } from "../interfaces";

export const warningMessage:WarningMessageInterface = {

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
    WARNING_JWT_NOT_EXPIRED:"Un lien de réinitialisation vous a déjà été envoyé. Veuillez l'utiliser dès maintenant. Si vous le perdez, veuillez attendre 10 minutes avant de faire une nouvelle demande.",

  WARNING_DOCUMENT_NOT_FOUND: (field: string): string =>
    `Aucun(e) ${field} n'a été trouvé correspondant aux critères de recherche spécifiés.`,
};
