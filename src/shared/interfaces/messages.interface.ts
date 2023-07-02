import { Types } from "mongoose";

interface ErrorMessageInterface {
  ERROR_EMPTY_USER_MODIFICATION: string;
  ERROR_SENT_NOTIFICATION_PASSWORD_CHANGED: string;
  ERROR_PAGE_NOT_FOUND: string;
  ERROR_ACTIVATION_ACCOUNT_TOKEN_NOT_EXPIRE: string;
  ERROR_ACCOUNT_NOT_ACTIVE: string;
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
  ERROR_SENT_NOTIFICATION_CREATE_API_KEY: string;
  ERROR_WRONG_PASSWORD: string;
  ERROR_WRONG_LOGIN: string;
  ERROR_WRONG_EMAIL: string;
  ERROR_SENT_EMAIL_RENEWAL_API_KEY: string;
  ERROR_WRONG_PASSWORD_ROUTE: string;
  ERROR_API_KEY_EXPIRE: string;
  ERROR_DUPLICATE_API_KEY: string;
  ERROR_SENT_API_KEY: string;
  ERROR_SENT_NOTIFICATION_EMAIL_CHANGED: string;
  ERROR_EMPTY_FIELD: (...field: string[]) => string;
  ERROR_MODIFIED_FIELD: (field: string) => string;
  ERROR_ADMIN_SENT_NEW_API_KEY: (idUser: string, userEmail: string) => string;
  ERROR_ADMIN_SENT_REFUSAL_API_KEY_CREATION: (
    idUser: string,
    userEmail: string
  ) => string;
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
  VALIDATE_FIELD: (field: string) => string;
}
interface SuccessMessageInterface {
  SUCCESS_ACTIVATION_ACCOUNT: string;
  SUCCESS_PASSWORD_MODIFIED: string;
  SUCCESS_EMAIL_MODIFIED: string;
  SUCCESS_CREATE_ACCOUNT: string;
  SUCCESS_ADMIN_REFUSAL_API_KEY_CREATION: (
    idApi: Types.ObjectId,
    idUser: Types.ObjectId
  ) => string;
  SUCCESS_DOCUMENT_DELETED: (id: Types.ObjectId) => string;
  SUCCESS_FIELDS_MODIFIED: (fields: object) => string;
  SUCCESS_SENT_EMAIL_ACTIVATION: (userEmail: string) => string;
  SUCCESS_SENT_EMAIL_RESET_PASSWORD: (userEmail: string) => string;
  SUCCESS_SENT_EMAIL_RESET_EMAIL: (userEmail: string) => string;
  SUCCESS_SENT_EMAIL_DISABLE_ACCOUNT: (userEmail: string) => string;
  SUCCESS_API_KEY_CREATION_REQUEST: (userEmail: string) => string;
  SUCCESS_SENT_EMAIL_RENEWAL_API_KEY: (userEmail: string) => string;
  SUCCESS_ACTIVE_API_KEY: (userEmail: string) => string;
  SUCCESS_SENT_EMAIL_CREATE_API_KEY: (userEmail: string) => string;
  SUCCESS_API_KEY_DELETED: (idApi: Types.ObjectId) => string;
  SUCCESS_DOCUMENT_CREATED: (id: Types.ObjectId) => string;
}

export default interface MessagesInterface {
  errorMessage: ErrorMessageInterface;
  successMessage: SuccessMessageInterface;
  validationMessage: ValidationMessageInterface;
}
