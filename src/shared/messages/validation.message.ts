import { ValidationMessageInterface } from "../interfaces";

export const validationMessage :ValidationMessageInterface= {
  VALIDATE_REQUIRED_FIELD: (fieldName: string): string =>
    `Le champ ${fieldName} est obligatoire`,
  VALIDATE_MIN_LENGTH: (fieldName: string, min: number): string =>
    `Le champ ${fieldName} doit contenir au minimum ${min} caractères`,
  VALIDATE_MAX_LENGTH: (fieldName: string, max: number): string =>
    `Le champ ${fieldName} doit contenir au maximum ${max} caractères`,
  VALIDATE_ONLY_STRING: (fieldName: string): string =>
    `Le champ ${fieldName} doit comporter uniquement des lettres`,
  VALIDATE_UNIQUE_FIELD: (fieldName: string): string =>
    `${fieldName} est déjà utilisée`,
  VALIDATE_PASSWORD: (numCharacters: number): string =>
    ` Le champ mot de passe doit contenir au minimum une lettre minuscule, une majuscule, un chiffre, un caractère spécial et avoir une longueur minimale de ${numCharacters} caractères.`,
  VALIDATE_PASSWORD_CONFIRM:
    "Le mot de passe de confirmation doit être identique a votre mot de passe",
  VALIDATE_EMPTY_VALUE: (fieldName: string): string =>
    `Veuillez saisir votre: ${fieldName}`,

  VALIDATE_FIELD: (field: string): string =>
    `Veuillez fournir ${field} valide.`,
};
