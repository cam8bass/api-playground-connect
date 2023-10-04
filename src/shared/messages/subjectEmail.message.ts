import { SubjectEmailInterface } from "../interfaces";
import {
  apiNameType,
  subjectEmailAcount,
  subjectEmailApiKey,
  subjectEmailReset,
} from "../types/types";

export const subjectEmail: SubjectEmailInterface = {
  SUBJECT_MODIFIED_STATUS: (type: subjectEmailAcount) =>
    `${type} de votre compte`, // type = activation | suppression | désactivation
  SUBJECT__RESET_FIELD: (field: subjectEmailReset): string =>
    `Réinitialisation de votre ${field}`, // field= mot de passe | email
  SUBJECT_API_KEY: (type: subjectEmailApiKey) => `${type} de votre clé d'api`, // type = création | suppréssion | renouvellement | mise à jour
  SUBJECT_ADMIN_VALID_NEW_API_KEY:
    "Demande de création d'une nouvelle clé d'API",
  SUBJECT_ADMIN_REFUSAL_API_KEY_CREATION:
    "Refus de demande de création de clé d'API",

  SUBJECT_FIELD_CHANGED: (field: string): string =>
    `Modification de votre ${field}`,
  SUBJECT_ACCOUNT_REACTIVATION:
    "Réactivation de votre compte - Bienvenue de nouveau !",
};
