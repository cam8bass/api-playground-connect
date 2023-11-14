import { Types } from "mongoose";

export interface ErrorMessageInterface {
  ERROR_EMPTY_USER_MODIFICATION: string;
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
  ERROR_CONFIRM_RENEWAL_REQUEST: string;
  ERROR_SENT_EMAIL_ACTIVATION: string;
  ERROR_SENT_EMAIL_RESET_PASSWORD: string;
  ERROR_LINK_ACTIVATION: string;
  ERROR_SENT_EMAIL_RESET_EMAIL: string;
  ERROR_RATE_LIMIT: string;
  ERROR_CONFIRM_CHANGE_EMAIL_REQUEST: string;
  ERROR_SENT_EMAIL_CREATE_API_KEY: string;
  ERROR_WRONG_PASSWORD: string;
  ERROR_WRONG_LOGIN: string;
  ERROR_WRONG_EMAIL: string;
  ERROR_SENT_EMAIL_RENEWAL_API_KEY: string;
  ERROR_WRONG_PASSWORD_ROUTE: string;
  ERROR_API_KEY_EXPIRE: string;
  ERROR_DUPLICATE_API_KEY: string;
  ERROR_EMPTY_FIELD: (...field: string[]) => string;
  ERROR_MODIFIED_FIELD: (field: string) => string;
}

export interface ValidationMessageInterface {
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

export interface WarningMessageInterface {
  WARNING__EMAIL: string;
  WARNING__REQUIRE_FIELD: string;
  WARNING_INVALID_FIELD: string;
  WARNING_INACTIVE_ACCOUNT: string;
  WARNING_MANIPULATE_FIELD: string;
  WARNING_EMPTY_MODIFICATION: string;
  WARNING_DUPLICATE_DOCUMENT: string;
  WARNING_ACCOUNT_BLOCKED: string;
  WARNING_PAGE_NOT_FOUND: string;
  WARNING_TOKEN: string;
  WARNING_DOCUMENT_NOT_FOUND: (field: string) => string;
}

export interface notificationMessageInterface {
  NOTIFICATION_ADMIN_CREATE_USER: string;
  NOTIFICATION_ADMIN_CREATE_AND_ACTIVE_APIKEY: string;
  NOTIFICATION_ADMIN_REFUSAL_API_KEY: string;
  NOTIFICATION_SUCCESS_DELETE_SELECTED_APIKEY: string;
  NOTIFICATION_EMAIL_MODIFIED: string;
  NOTIFICATION_PASSWORD_MODIFIED: string;
  NOTIFICATION_ACTIVATION_ACCOUNT: string;
  NOTIFICATION_SENT_EMAIL_PASSWORD_CHANGED: string;
  NOTIFICATION_EMAIL_DISABLE_ACCOUNT: string;
  NOTIFICATION_SENT_EMAIL_DELETE_ACCOUNT: string;
  NOTIFICATION_SENT_EMAIL_ACTIVATION_ACCOUNT: string;
  NOTIFICATION_SENT_EMAIL_API_KEY: string;
  NOTIFICATION_SENT_EMAIL_CHANGED: string;
  NOTIFICATION_SUCCESS_CREATE_ACCOUNT: string;
  NOTIFICATION_DELETE_ACCOUNT: string;
  NOTIFICATION_DELETE_USER_APIKEYS: string;
  NOTIFICATION_SENT_EMAIL_ACTIVATION: (userEmail: string) => string;
  NOTIFICATION_SENT_EMAIL_RESET_PASSWORD: (userEmail: string) => string;
  NOTIFICATION_FIELDS_MODIFIED: (fields: object) => string;
  NOTIFICATION_SENT_EMAIL_RESET_EMAIL: (userEmail: string) => string;
  NOTIFICATION_SENT_EMAIL_DISABLE_ACCOUNT: (userEmail: string) => string;
  NOTIFICATION_API_KEY_CREATION_REQUEST: (userEmail: string) => string;
  NOTIFICATION_SENT_EMAIL_RENEWAL_API_KEY: (userEmail: string) => string;
  NOTIFICATION_SENT_EMAIL_CREATE_API_KEY: (userEmail: string) => string;
  NOTIFICATION_ACTIVE_API_KEY: (userEmail: string) => string;

  NOTIFICATION_ADMIN_SENT_REFUSAL_API_KEY_CREATION: (
    idUser: Types.ObjectId,
    userEmail: string
  ) => string;
  NOTIFICATION_ADMIN_SENT_NEW_API_KEY: (
    idUser: Types.ObjectId,
    userEmail: string
  ) => string;
}
