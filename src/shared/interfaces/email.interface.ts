import { Types } from "mongoose";
import { apiNameType, subjectEmailAcount, subjectEmailApiKey, subjectEmailReset } from "../types/types";

export interface BodyEmailInterface {
  ACCOUNT_DISABLED: string;
  ACCOUNT_DELETED: string;
  ACCOUNT_ACTIVATED: string;
  REFUSAL_API_KEY_CREATION: string;
  PASSWORD_CHANGED: string;
  SEND_NOTIFICATION_ACCOUNT_REACTIVATION: string;
  SEND_RESET_URL: (resetUrl: string, expire: number) => string;
  SEND_API_KEY: (apiKey: string) => string;
  SEND_ADMIN_CREATION_REQUEST_API_KEY_NOTIFICATION: (
    apiName: apiNameType,
    idApi: Types.ObjectId,
    idUser: Types.ObjectId
  ) => string;
  SEND_NOTIFICATION_EMAIL_CHANGED: (newEmail: string) => string;
}

export interface SubjectEmailInterface {
  SUBJECT_ADMIN_VALID_NEW_API_KEY: string;
  SUBJECT_ADMIN_REFUSAL_API_KEY_CREATION: string;
  SUBJECT_ACCOUNT_REACTIVATION: string;
  SUBJECT_MODIFIED_STATUS: (type: subjectEmailAcount) => string;
  SUBJECT__RESET_FIELD: (field: subjectEmailReset) => string;
  SUBJECT_API_KEY: (type: subjectEmailApiKey) => string;
  SUBJECT_FIELD_CHANGED: (field: string) => string;
}
