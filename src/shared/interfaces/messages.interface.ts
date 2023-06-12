interface ErrorMessageInterface {
  ERROR_NO_SEARCH_RESULTS: string;
  ERROR_EMPTY_LOGIN: string;
  ERROR_ACCOUNT_LOCKED: string;
  ERROR_LOGIN_REQUIRED: string;
  ERROR_ACCESS_DENIED: string;
  ERROR_SESSION_EXPIRED: string;
  ERROR_REQUEST_EXPIRED: string;
  ERROR_SENT_EMAIL_ACTIVATION: string;
  ERROR_SENT_EMAIL_RESET_PASSWORD: string;
  ERROR_LINK_ACTIVATION_EXPIRED: string;
  ERROR_SENT_EMAIL_RESET_EMAIL: string;
  ERROR_SENT_EMAIL_DISABLE_ACCOUNT: string;
  ERROR_SENT_NOTIFICATION_DELETE_ACCOUNT: string;
  ERROR_SENT_NOTIFICATION_ACTIVATION_ACCOUNT: string;
  ERROR_WRONG_PASSWORD: string;
  ERROR_EMPTY_PASSWORD: string;
  ERROR_WRONG_LOGIN: string;
  ERROR_EMPTY_EMAIL: string;
  ERROR_EMPTY_NEW_EMAIL: string;
  ERROR_WRONG_EMAIL: string;
  ERROR_WRONG_PASSWORD_ROUTE: string;
}

interface ValidationMessageInterface {
  VALIDATE_REQUIRED_FIELD: (fieldName: string) => string;
  VALIDATE_MIN_LENGTH: (fieldName: string, min: number) => string;
  VALIDATE_MAX_LENGTH: (fieldName: string, max: number) => string;
  VALIDATE_ONLY_STRING: (fieldName: string) => string;
  VALIDATE_UNIQUE_FIELD: (fieldName: string) => string;
  VALIDATE_PASSWORD: (numCharacters: number) => string;
  VALIDATE_PASSWORD_CONFIRM: string;
  VALIDATE_EMPTY_VALUE: (fieldName: string) => string;
  VALIDATE_EMAIL: string;
}
interface SuccessMessageInterface {
  SUCCESS_ACTIVATION_ACCOUNT: string;
  SUCCESS_PASSWORD_MODIFIED: string;
  SUCCESS_EMAIL_MODIFIED: string;
  SUCCESS_DOCUMENT_DELETED: (id: string) => string;
  SUCCESS_FIELDS_MODIFIED: (fields: object) => string;
  SUCCESS_SENT_EMAIL_ACTIVATION: (userEmail: string) => string;
  SUCCESS_SENT_EMAIL_RESET_PASSWORD: (userEmail: string) => string;
  SUCCESS_SENT_EMAIL_RESET_EMAIL: (userEmail: string) => string;
  SUCCESS_SENT_EMAIL_DISABLE_ACCOUNT: (userEmail: string) => string;
}

export default interface MessagesInterface {
  errorMessage: ErrorMessageInterface;
  successMessage: SuccessMessageInterface;
  validationMessage: ValidationMessageInterface;
}
