import { Types } from "mongoose";
import { notificationMessageInterface } from "../interfaces";

export const notificationMessage: notificationMessageInterface = {
  NOTIFICATION_EMAIL_MODIFIED:
    "Votre adresse e-mail a été modifiée avec succès.",

  NOTIFICATION_PASSWORD_MODIFIED:
    "Votre mot de passe a été modifié avec succès.",
  NOTIFICATION_ACTIVATION_ACCOUNT: "Votre compte a été activé avec succès.",
  NOTIFICATION_SUCCESS_CREATE_ACCOUNT:
    "Votre compte a bien été créé. Veuillez vous connecter à la page de connexion avec vos identifiants pour commencer la procédure d'activation du compte.",
  NOTIFICATION_SENT_EMAIL_DELETE_ACCOUNT:
    "Une erreur est survenue lors de l'envoi de l'e-mail de notification de suppression de compte. Cependant, la suppression du compte a bien été prise en compte.",
  NOTIFICATION_SENT_EMAIL_ACTIVATION_ACCOUNT:
    "Une erreur est survenue lors de l'envoi de l'e-mail de notification de l'activation de votre compte. Cependant, la l'activation du compte a bien été prise en compte.",
  NOTIFICATION_SENT_EMAIL_API_KEY:
    "Nous sommes désolés, mais une erreur s'est produite lors de l'envoi de l'e-mail de confirmation pour votre demande de clé d'API. Cependant, votre demande a bien été prise en compte. Vous pouvez trouver votre nouvelle clé d'API dans votre espace personnel. ",
  NOTIFICATION_EMAIL_DISABLE_ACCOUNT:
    "Une erreur est survenue lors de l'envoi de l'e-mail de notification de désactivation de compte. Cependant, la désactivation de votre compte a bien été prise en compte.",
  NOTIFICATION_SENT_EMAIL_CHANGED:
    "Nous sommes désolés, mais une erreur s'est produite lors de l'envoi de l'e-mail de notification pour le changement de votre adresse e-mail. Cependant, nous tenons à vous assurer que la modification a été enregistrée avec succès. Nous nous excusons pour ce désagrément.",
  NOTIFICATION_SENT_EMAIL_PASSWORD_CHANGED:
    "Nous sommes désolés, mais une erreur s'est produite lors de l'envoi de l'e-mail de notification pour le changement de votre mot de passe. Cependant, nous tenons à vous assurer que la modification a été enregistrée avec succès. Nous nous excusons pour ce désagrément.",
  NOTIFICATION_SENT_EMAIL_ACTIVATION: (userEmail: string): string =>
    `Un email de confirmation concernant l'activation de votre compte a été envoyé à ${userEmail}. Veuillez vérifier votre boîte de réception.`,
  NOTIFICATION_SENT_EMAIL_RESET_PASSWORD: (userEmail: string): string =>
    `Un email de confirmation concernant la réinitialisation de votre mot de passe a été envoyé à ${userEmail}. Veuillez vérifier votre boîte de réception.`,
  NOTIFICATION_FIELDS_MODIFIED: (fields: object): string =>
    `Les modifications concernant les champs ${fields} ont été prises en compte.`,
  NOTIFICATION_SENT_EMAIL_RESET_EMAIL: (userEmail: string): string =>
    `Un email de confirmation concernant la changement de votre adresse email a été envoyé à ${userEmail}. Veuillez vérifier votre boîte de réception.`,
  NOTIFICATION_SENT_EMAIL_DISABLE_ACCOUNT: (userEmail: string): string =>
    `Votre compte a été désactivé avec succès. Un email de notification a été envoyé à ${userEmail}. Veuillez vérifier votre boîte de réception.`,
   NOTIFICATION_API_KEY_CREATION_REQUEST: (userEmail: string): string =>
    `Nous vous remercions d'avoir soumis votre demande de création de clé d'API. Votre demande a été enregistrée avec succès. Notre équipe va l'examiner attentivement et nous vous contacterons personnellement par e-mail à l'adresse ${userEmail} pour vous tenir informé(e) de l'avancement de votre demande.`,
    NOTIFICATION_SENT_EMAIL_RENEWAL_API_KEY: (userEmail: string) =>
    `Un email de confirmation concernant votre demande de renouvellement de clé d'API a été envoyé à l'adresse ${userEmail}. Veuillez vérifier votre boîte de réception`,
    NOTIFICATION_SENT_EMAIL_CREATE_API_KEY: (userEmail: string): string =>
    `Un email contenant votre nouvelle clé d'API a été envoyé à l'adresse ${userEmail}. Veuillez vérifier votre boîte de réception.`,
    NOTIFICATION_ACTIVE_API_KEY: (userEmail: string): string =>
    `La clé d'api vient a été activé avec succés, un email vient d'etre envoyé à l'utilisateur ${userEmail}`,
    NOTIFICATION_ADMIN_SENT_REFUSAL_API_KEY_CREATION: (
      idUser: Types.ObjectId,
      userEmail: string
    ): string =>
      `Une erreur s'est produite lors de l'envoi de l'e-mail de notification pour le refus concernant la demande de création de clé d'API pour l'utilisateur ${idUser}. Veuillez vérifier les paramètres de messagerie et l'état du service de messagerie pour résoudre le problème. En attendant, veuillez traiter manuellement la demande de l'utilisateur et lui fournir les informations nécessaires à l'adresse : ${userEmail}. Merci de votre attention.`,

      NOTIFICATION_ADMIN_SENT_NEW_API_KEY: (
        idUser: Types.ObjectId,
        userEmail: string
      ): string =>
        `Une erreur s'est produite lors de l'envoi de l'e-mail de notification confirmant la création de la clé d'API pour l'utilisateur ${idUser}. Veuillez vérifier les paramètres de messagerie et l'état du service de messagerie pour résoudre le problème. En attendant, veuillez traiter manuellement la demande de clé d'API de l'utilisateur et lui fournir les informations nécessaires à l'adresse : ${userEmail}. Merci de votre attention.`,
};
