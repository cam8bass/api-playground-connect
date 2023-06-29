import { Types } from "mongoose";
import {
  apiNameType,
  subjectEmailAcount,
  subjectEmailApiKey,
  subjectEmailReset,
} from "../types/types";

export const emailMessages = {
  bodyEmail: {
    ACCOUNT_DISABLED:
      "Nous tenons à vous informer que votre compte a été désactivé avec succès. Cependant, veuillez noter que nous nous réservons le droit de supprimer définitivement votre compte de notre système. Si vous souhaitez réactiver votre compte, il vous suffit de vous connecter en utilisant vos identifiants habituels. Votre compte sera réactivé instantanément et vous pourrez à nouveau profiter de tous nos services.",
    ACCOUNT_DELETED:
      "Nous vous informons avec regret que votre compte a été supprimé de manière permanente de notre système. Toutes les informations liées à votre compte, y compris les données personnelles et les paramètres, ont été effacées conformément à notre politique de confidentialité.",
    ACCOUNT_ACTIVATED:
      "Nous sommes ravis de vous informer que votre compte a été activé avec succès. Vous pouvez maintenant vous connecter à votre compte en utilisant vos identifiants de connexion.",

    REFUSAL_API_KEY_CREATION:
      "Nous vous informons que la demande de création de clé d'API a été refusée. Nous nous réservons le droit de refuser la création de clé d'API dans certaines circonstances. Veuillez nous contacter si vous avez des questions ou besoin d'informations supplémentaires. Merci de votre compréhension.",
    PASSWORD_CHANGED:
      "Nous tenons à vous informer que le mot de passe de votre compte a été modifié avec succès. Votre nouveau mot de passe est maintenant actif et vous pouvez l'utiliser pour vous connecter à votre compte.",

    SEND_RESET_URL: (resetUrl: string, expire: number): string => `
      Pour procéder à votre demande, veuillez cliquer sur le lien ci-dessous.
  
      Veuillez noter que ce lien est valable pendant ${expire} minutes à partir de l'envoi de cet e-mail.
  
      ${resetUrl}\n
  
      Si vous n'êtes pas à l'origine de cette demande et que vous pensez que votre compte a été compromis, nous vous recommandons vivement de prendre des mesures immédiates pour assurer la sécurité de votre compte, comme le changement de votre mot de passe.`,

    SEND_API_KEY: (apiKey: string): string => `
  Voici les détails de votre clé d'API :

  Clé d'API : ${apiKey}
  Date d'expiration : 1 ans
  
  Veuillez noter que votre clé d'API est confidentielle et doit être traitée avec précaution. Elle vous permettra d'authentifier et d'accéder à nos fonctionnalités et services. Assurez-vous de la garder en sécurité et de ne pas la partager avec des personnes non autorisées.
  
  Votre clé d'API a une date d'expiration, indiquée ci-dessus. Avant la date d'expiration, vous aurez la possibilité de renouveler votre clé d'API une semaine avant qu'elle ne devienne invalide.
  
  Pour renouveler votre clé d'API, veuillez suivre les instructions suivantes :
  - Connectez-vous à votre compte utilisateur sur notre plateforme.
  - Accédez à la section "Clés d'API" ou "Gestion des clés".
  - Recherchez la clé d'API expirante et suivez les étapes pour effectuer une demande de renouvellement.
  
  Veuillez noter que si vous ne renouvelez pas votre clé d'API avant sa date d'expiration, elle deviendra inutilisable. Dans ce cas, vous devrez à nouveau faire une demande de création de clé d'API en suivant la procédure habituelle.`,
    SEND_ADMIN_CREATION_REQUEST_API_KEY_NOTIFICATION: (
      apiName: apiNameType,
      idApi: Types.ObjectId,
      idUser: Types.ObjectId
    ) =>
      `Nous vous informons qu'un utilisateur a soumis une demande de création d'une nouvelle clé d'API. Voici les détails de la demande :
  Nom de l'API : ${apiName}
  Utilisateur : ${idUser}
  Id de l'api: ${idApi}

  Veuillez prendre les mesures appropriées pour examiner et traiter cette demande dans les meilleurs délais.
  Cordialement,`,
    SEND_NOTIFICATION_EMAIL_CHANGED: (newEmail: string): string =>
      `Nous avons le plaisir de vous informer que votre adresse e-mail a été modifiée avec succès dans notre système. Désormais, toutes les communications relatives à votre compte seront envoyées à votre nouvelle adresse e-mail : ${newEmail}.`,
    SEND_NOTIFICATION_ACCOUNT_REACTIVATION:
      "Nous sommes ravis de vous accueillir de nouveau! Votre compte a été réactivé avec succès, et nous sommes impatients de vous offrir une expérience exceptionnelle. Nous avons remarqué que vous aviez désactivé temporairement votre compte, mais nous sommes heureux de vous retrouver parmi nous. Votre compte est maintenant pleinement fonctionnel, et vous pouvez à nouveau profiter de tous les avantages et fonctionnalités de notre plateforme.",
  },

  subjectEmail: {
    SUBJECT_MODIFIED_STATUS: (type: subjectEmailAcount) =>
      `${type} de votre compte`, // type = activation | suppression | désactivation
    SUBJECT__RESET_FIELD: (field: subjectEmailReset): string =>
      `Réinitialisation de votre ${field}`, // field= mot de passe | email
    SUBJECT_API_KEY: (type: subjectEmailApiKey) => `${type} de votre clé d'api`, // type = création | suppréssion | renouvellement | mise à jour
    SUBJECT_ADMIN_VALID_NEW_API_KEY:
      "Demande de création d'une nouvelle clé d'API",
    SUBJECT_ADMIN_REFUSAL_API_KEY_CREATION:
      "Refus de demande de création de clé d'API",
    SUBJECT_EMAIL_CHANGED: "Modification de votre adresse e-mail",
    SUBJECT_ACCOUNT_REACTIVATION:
      "Réactivation de votre compte - Bienvenue de nouveau !",
  },
};
