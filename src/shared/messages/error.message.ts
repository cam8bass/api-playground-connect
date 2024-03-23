import { Types } from "mongoose";
import { ErrorMessageInterface } from "../interfaces";

export const errorMessage: ErrorMessageInterface = {

  ERROR_REQUEST_PARAMETERS_CORRUPTED:"Votre lien est corrompu. Veuillez réessayer ou renouveler votre demande.",

  ERROR_INVALID_REQUEST_PARAMETERS:"Votre lien est incorrect, veuillez renouveler votre demande.",
  ERROR_TOKEN_MANIPULATED:"Le lien a été modifié, veuillez renouveler votre demande.",
  ERROR_SEND_EMAIL_RE_ENABLE_ACCOUNT:
    "Nous avons rencontré une erreur lors de l'envoi de l'e-mail de réactivation du compte. Les administrateurs ont été notifiés. Malgré cela, votre compte est désormais activé. Nous sommes ravis de vous accueillir à nouveau.",
  ERROR_ACCOUNT_DISABLED:
    "Votre compte est désactivé. Pour le réactiver, veuillez vous reconnecter à votre compte.",
  ERROR_EMPTY_USER_MODIFICATION:
    "Désolé, mais aucune modification n'a été prise en compte. Veuillez saisir des champs valides pour effectuer des modifications.",
  ERROR_ACTIVATION_ACCOUNT_TOKEN_NOT_EXPIRE:
    "Veuillez activer votre compte en utilisant le lien d'activation qui vous a été envoyé à votre adresse e-mail. Si vous avez perdu l'e-mail contenant le lien d'activation, veuillez patienter pendant 10 minutes avant de vous connecter à la page de connexion avec vos identifiants. Cela permettra de générer la procédure d'activation du compte.",
  ERROR_ACCOUNT_NOT_ACTIVE:
    "Votre compte n'est pas activé. Veuillez vous connecter à la page de connexion avec vos identifiants pour générer la procédure d'activation du compte.",
  ERROR_NO_SEARCH_RESULTS:
    "Désolé, aucune correspondance n'a été trouvée pour votre recherche.",

  ERROR_EMPTY_LOGIN: "Veuillez entrer vos identifiants de connexion.",
  ERROR_PAGE_NOT_FOUND:
    "La page que vous recherchez est introuvable. Veuillez vérifier l'URL ou revenir à la page précédente.",
  ERROR_ACCOUNT_LOCKED:
    "Suite à un nombre important de tentatives de connexion erronées, votre compte a été bloqué pendant 1 heure. Si vous n'êtes pas à l'origine de ce blocage, nous vous conseillons de réinitialiser vos identifiants de connexion.",

  ERROR_LOGIN_REQUIRED:
    "Veuillez vous connecter à votre compte pour accéder à cette page.",

  ERROR_ACCESS_DENIED:
    "Vous ne disposez pas des droits d'accès nécessaires pour accéder à cette page.",

  ERROR_SESSION_EXPIRED:
    "Votre session a expiré. Veuillez vous connecter à votre compte.",
  ERROR_REQUEST_EXPIRED: "Votre demande à expiré. Veuillez la renouveler",
  ERROR_CONFIRM_RENEWAL_REQUEST:
    "Une erreur est survenue lors du renouvellement de votre clé d'API. Veuillez vérifier que vos identifiants sont corrects ou que votre demande n'a pas expiré. De plus, veuillez noter que la clé d'activation liée à cette demande doit être préalablement activée.",
  ERROR_CONFIRM_CHANGE_EMAIL_REQUEST:
    "Un problème est survenu lors de la modification de votre adresse e-mail. Nous vous prions de vérifier que vos identifiants sont exacts.",
  ERROR_CONFIRM_CHANGE_EMAIL_REQUEST_JWT_EXPIRED:
    "Votre lien a expiré. Veuillez renouveler votre demande pour générer la procédure de changement de votre adresse e-mail.",
  ERROR_JWT_TOKEN_EXPIRED_ACTIVATION_ACCOUNT:
    "Votre lien d'activation a expiré. veuillez retourner à la page de connexion et essayer de vous connecter avec vos identifiants. Un nouveau lien d'activation vous sera envoyé.",
  ERROR_LINK_ACTIVATION:
    "Une erreur est survenue lors de l'activation de votre compte. Veuillez vérifier que vos identifiants sont corrects. Dans le cas où le lien d'activation aurait expiré, veuillez retourner à la page de connexion et essayer de vous connecter avec vos identifiants. Un nouveau lien d'activation vous sera envoyé.",
  ERROR_SENT_EMAIL_ACTIVATION:
    "Une erreur est survenue lors de l'envoi de l'e-mail d'activation du compte. Veuillez vous rendre sur la page de connexion et tenter de vous connecter à nouveau pour générer un nouvel e-mail d'activation. Si le problème persiste, veuillez contacter l'équipe de support.",

  ERROR_SENT_EMAIL_CREATE_API_KEY:
    "Nous sommes désolés, mais une erreur s'est produite lors de l'envoi de l'e-mail de confirmation pour votre demande de clé d'API. Veuillez réessayer ultérieurement. Si le problème persiste, veuillez contacter l'équipe de support.  ",

  ERROR_SENT_EMAIL_RESET_PASSWORD:
    "Une erreur est survenue lors de l'envoi de l'e-mail réinitialisation de votre mot de passe. Veuillez réessayer ultérieurement. Si le problème persiste, veuillez contacter l'équipe de support.",

  ERROR_SENT_EMAIL_RESET_EMAIL:
    "Une erreur est survenue lors de l'envoi de l'e-mail changement de votre adresse email. Veuillez réessayer ultérieurement. Si le problème persiste, veuillez contacter l'équipe de support.",

  ERROR_SENT_EMAIL_RENEWAL_API_KEY:
    "Une erreur s'est produite lors de l'envoi de l'e-mail de renouvellement de votre clé d'API. Veuillez réessayer ultérieurement. Si le problème persiste, veuillez contacter l'équipe de support",
  ERROR_WRONG_PASSWORD: "Veuillez founir un mot de passe correct",
  ERROR_WRONG_LOGIN: "Veuillez vérifier vos identifiants de connection",
  ERROR_WRONG_EMAIL: "Veuillez vérifier votre adresse email",
  ERROR_WRONG_PASSWORD_ROUTE:
    "Pour modifier votre mot de passe, veuillez vous rediriger vers la section prévu à cet effet.",

  ERROR_API_KEY_NOT_FOUND:
    "Désolé, nous ne trouvons pas de clé d'API pouvant être renouvelée pour le moment. Veuillez vérifier si votre clé d'API est expirée ou en attente de validation. Si ce n'est pas le cas, veuillez contacter notre équipe de support pour obtenir une assistance supplémentaire. Merci de votre compréhension.",
  ERROR_DUPLICATE_API_KEY: "Vous disposez déjà d'une clé pour cette API.",
  ERROR_RATE_LIMIT:
    "Vous avez atteint le nombre maximal de requêtes autorisées. Veuillez réessayer ultérieurement.",
  ERROR_EMPTY_FIELD: (...field: string[]): string =>
    `Veuillez remplir le(s) champ(s): ${field}`,
  ERROR_MODIFIED_FIELD: (field: string) =>
    `Désolé, il n'est pas possible de modifier le champ: ${field}.`,
  ERROR_SEND_EMAIL: (
    action: string,
    idUser: Types.ObjectId,
    email: string
  ) => `Une erreur s'est produite lors de l'envoi de l'e-mail relatif à l'action suivante : ${action} pour l'utilisateur ${idUser} identifié par l'adresse e-mail ${email}.
  `,
};
