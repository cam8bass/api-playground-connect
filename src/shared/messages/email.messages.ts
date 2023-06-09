import { emailType } from "../types/types";

export const EMAIL_ACTIVATION_ERROR =
  "Une erreur est survenue lors de l'activation de votre compte. Veuillez vérifier votre mot de passe. Si le problème persiste, veuillez vous rendre sur la page de connexion et tenter de vous connecter, ce qui générera un nouvel email d'activation.";

export const EMAIL_SEND_ERROR =
  "Une erreur est survenue lors de l'envoi de l'email d'activation de compte. Veuillez vous rendre sur la page de connexion et tenter de vous connecter, ce qui générera un nouvel email d'activation. Si le problème persiste, veuillez contacter l'équipe de support.";

export const EMAIL_FORGOTPASSWORD_ERROR =
  "Une erreur est survenue lors de l'envoi de l'email de réinitialisation de votre mot de passe. Veuillez réessayer ultérieurement. Si le problème persiste, veuillez contacter l'équipe de support.";

export const EMAIL_RESET_EMAIL_ERROR =
  "Une erreur est survenue lors de l'envoi de l'email de modification de votre adresse email. Veuillez réessayer ultérieurement. Si le problème persiste, veuillez contacter l'équipe de support.";

export const EMAIL_DISABLE_ACCOUNT_ERROR =
  "Une erreur est survenue lors de l'envoi de l'email de notification de désactivation de compte. Cependant, la désactivation de votre compte a bien été prise en compte.";

export const EMAIL_DISABLE_ACCOUNT = `Bonjour\n,

Nous vous informons par la présente que votre demande de désactivation de compte a été prise en compte. Votre compte utilisateur a été désactivé conformément à votre demande.\n

Il est important de noter que nous conservons le droit de conserver votre compte et de le supprimer de manière définitive. Cependant, si vous souhaitez réactiver votre compte à tout moment, vous pouvez le faire en vous connectant à celui-ci avec vos identifiants habituels.\n

Nous tenons à vous rappeler que la réactivation de votre compte rétablira l'accès à toutes les fonctionnalités et informations liées à votre profil utilisateur.\n

Si vous avez des questions supplémentaires ou besoin d'une assistance quelconque, n'hésitez pas à contacter le service support.\n

Cordialement,\n

L'équipe technique de Playground Api`;

export const emailSubject = (options: emailType): string => {
  let message: string | undefined;
  if (options === "signup") {
    message = "Activation de votre compte";
  } else if (options === "password") {
    message = "Mot de passe oublié";
  } else if (options === "email") {
    message = "Changement d'adresse email";
  } else if (options === "disable") {
    message = "Désactivation de compte";
  }
  return message;
};

export const emailMessage = (
  options: emailType,
  resetUrl: string,
  expire: number
): string => {
  let subject: string | undefined;
  if (options === "signup") {
    subject = "Activation de compte";
  } else if (options === "password") {
    subject = "Réinitialisation de mot de passe";
  } else if (options === "email") {
    subject = "Changement d'adresse email";
  }

  return `Bonjour,\n

  Nous avons reçu une demande de type : ${subject}. Pour procéder à votre demande, veuillez cliquer sur le lien ci-dessous. Veuillez noter que ce lien est valable pendant ${expire} minutes à partir de l'envoi de cet e-mail :\n
  ${resetUrl}\n
  
  Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail. La situation actuelle de votre compte restera inchangée.\n
  
  Cordialement,\n
  L'équipe technique de Playground Api
  `;
};
