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

    EMAIL_CHANGED:
      "Nous vous informons que votre adresse e-mail a été modifiée avec succès. À partir de maintenant, veuillez utiliser la nouvelle adresse e-mail pour vous connecter à votre compte.",

    PASSWORD_CHANGED:
      "Nous tenons à vous informer que le mot de passe de votre compte a été modifié avec succès. Votre nouveau mot de passe est maintenant actif et vous pouvez l'utiliser pour vous connecter à votre compte.",

    SEND_RESET_URL: (resetUrl: string, expire: number): string => `
      Pour procéder à votre demande, veuillez cliquer sur le lien ci-dessous.\n
  
      Veuillez noter que ce lien est valable pendant ${expire} minutes à partir de l'envoi de cet e-mail.\n 
  
      ${resetUrl}\n
  
      Si vous n'êtes pas à l'origine de cette demande et que vous pensez que votre compte a été compromis, nous vous recommandons vivement de prendre des mesures immédiates pour assurer la sécurité de votre compte, comme le changement de votre mot de passe.\n
  `,

    SEND_API_KEY: (apiKey: string): string => `
  Voici les détails de votre clé d'API :\n

  Clé d'API : ${apiKey}
  Date d'expiration : 1 ans
  
  Veuillez noter que votre clé d'API est confidentielle et doit être traitée avec précaution. Elle vous permettra d'authentifier et d'accéder à nos fonctionnalités et services. Assurez-vous de la garder en sécurité et de ne pas la partager avec des personnes non autorisées.
  
  Votre clé d'API a une date d'expiration, indiquée ci-dessus. Avant la date d'expiration, vous aurez la possibilité de renouveler votre clé d'API une semaine avant qu'elle ne devienne invalide.\n
  
  Pour renouveler votre clé d'API, veuillez suivre les instructions suivantes :\n
  - Connectez-vous à votre compte utilisateur sur notre plateforme.
  - Accédez à la section "Clés d'API" ou "Gestion des clés".
  - Recherchez la clé d'API expirante et suivez les étapes pour effectuer une demande de renouvellement.\n
  
  Veuillez noter que si vous ne renouvelez pas votre clé d'API avant sa date d'expiration, elle deviendra inutilisable. Dans ce cas, vous devrez à nouveau faire une demande de création de clé d'API en suivant la procédure habituelle.`,
    SEND_ADMIN_CREATION_REQUEST_API_KEY_NOTIFICATION: (
      apiName: apiNameType,
      idUser: string
    ) =>
      `Cher [Votre nom],
  Nous vous informons qu'un utilisateur a soumis une demande de création d'une nouvelle clé d'API. Voici les détails de la demande :
  Nom de l'API : ${apiName}
  Utilisateur : ${idUser}
  Veuillez prendre les mesures appropriées pour examiner et traiter cette demande dans les meilleurs délais.
  Cordialement,`,
  },

  subjectEmail: {
    SUBJECT_MODIFIED_STATUS: (type: subjectEmailAcount) =>
      `${type} de votre compte`, // type = activation | suppression | désactivation
    SUBJECT__RESET_FIELD: (field: subjectEmailReset): string =>
      `Réinitialisation de votre ${field}`, // field= mot de passe | email
    SUBJECT_API_KEY: (type: subjectEmailApiKey) => `${type} de votre clé d'api`, // type = création | suppréssion | renouvellement | mise à jour
    SUBJECT_ADMIN_VALID_NEW_API_KEY:
      "Demande de création d'une nouvelle clé d'API",
  },
};
