import { emailType } from "../types/types";

export const EMAIL_ACTIVATION_ERROR =
  "Une erreur est survenue lors de l'activation de votre compte. Veuillez vérifier votre mot de passe. Si le problème persiste, veuillez vous rendre sur la page de connexion et tenter de vous connecter, ce qui générera un nouvel email d'activation.";

export const EMAIL_SEND_ERROR =
  "Une erreur est survenue lors de l'envoi de l'email d'activation de compte. Veuillez vous rendre sur la page de connexion et tenter de vous connecter, ce qui générera un nouvel email d'activation. Si le problème persiste, veuillez contacter l'équipe de support.";

export const emailSubject = (options: emailType): string => {
  let message: string | undefined;
  if (options === "signup") {
    message = "Activation de votre compte";
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
  }

  return `Bonjour,\n

  Nous avons reçu une demande de type : ${subject}. Pour procéder à votre demande, veuillez cliquer sur le lien ci-dessous. Veuillez noter que ce lien est valable pendant ${expire} minutes à partir de l'envoi de cet e-mail :\n
  ${resetUrl}\n
  
  Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail. La situation actuelle de votre compte restera inchangée.\n
  
  Cordialement,\n
  L'équipe technique de Playground Api
  `;
};
