export type nodeEnvType = "development" | "production";
export type userRoleType = "user" | "admin";
export type errorStatusType = "fail" | "error";
export type resetType = "password" | "email" | "activation" | "apiKey";
export type subjectEmailAcount = "Activation" | "Suppression" | "Désactivation";
export type subjectEmailReset = "email" | "mot de passe";
export type apiNameType = "Api-travel" | "Api-test1" | "Api-test2";
export type subjectEmailApiKey =
  | "Création"
  | "Suppréssion"
  | "Renouvellement"
  | "Mise à jour";

export type notificationType = "success" | "fail" | "error";

export type errorCategoriesType =
  | "external"
  | "validation"
  | "server"
  | "request"
  | "security";

export type errorPriorityType = "critical" | "warning" | "info";

export type requestStatusType = "success" | "fail" | "error";
