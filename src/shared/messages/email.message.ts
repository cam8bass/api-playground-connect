import { subjectEmailAcount, subjectEmailReset } from "../types/types";

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
  },

  subjectEmail: {
    SUBJECT_MODIFIED_STATUS: (type: subjectEmailAcount) =>
      `${type} de votre compte`, // type = activation | suppression | désactivation
    SUBJECT__RESET_FIELD: (field: subjectEmailReset): string =>
      `Réinitialisation de votre ${field}`, // field= mot de passe | email
  },
};
