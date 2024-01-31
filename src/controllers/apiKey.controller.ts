import {
  apiKeyCreationRequestMiddleware,
  apiKeyRenewalRequestMiddleware,
  confirmRenewalApiKeyMiddleware,
  deleteSelectedApiKeyMiddleware,
  getMyApikeyMiddleware,
} from "../middlewares/apiKey";

/**
 * Get user api key middleware
 */
export const getMyApikey = [
  getMyApikeyMiddleware.findApiKeys,
  getMyApikeyMiddleware.generateReponse,
];

/**
 * user api key creation request middleware
 */
export const apiKeyCreationRequest = [
  apiKeyCreationRequestMiddleware.verifyField,
  apiKeyCreationRequestMiddleware.findUserAndCheckApiKeys,
  apiKeyCreationRequestMiddleware.findAndUpdateNewApiKey,
  apiKeyCreationRequestMiddleware.searchIdNewApi,
  apiKeyCreationRequestMiddleware.sendEmail,
  apiKeyCreationRequestMiddleware.createAdminNotificationIfErrorSendEmail,
  apiKeyCreationRequestMiddleware.findAndDeleteApiKeyIfNotSendEmail,
  apiKeyCreationRequestMiddleware.findAndDeleteDocumentIfLastApiKey,
  apiKeyCreationRequestMiddleware.generateErrorIfNotSendEmail,
  apiKeyCreationRequestMiddleware.createAdminNotification,
  apiKeyCreationRequestMiddleware.createUserNotification,
  apiKeyCreationRequestMiddleware.generateResponse,
];

/**
 * api key renewal request middleware
 */
export const apiKeyRenewalRequest = [
  apiKeyRenewalRequestMiddleware.createResetToken,
  apiKeyRenewalRequestMiddleware.findAndUpdateRenewalApiKey,
  apiKeyRenewalRequestMiddleware.createResetUrlWithResetToken,
  apiKeyRenewalRequestMiddleware.sendEmail,
  apiKeyRenewalRequestMiddleware.createAdminNotification,
  apiKeyRenewalRequestMiddleware.findAndUpdateRenewalToken,
  apiKeyRenewalRequestMiddleware.generateErrorIfNotSendEmail,
  apiKeyRenewalRequestMiddleware.createUserNotification,
  apiKeyRenewalRequestMiddleware.generateResponse,
];

/**
 * user confirm renewal api key middleware
 */
export const confirmRenewalApiKey = [
  confirmRenewalApiKeyMiddleware.verifyFields,
  confirmRenewalApiKeyMiddleware.findUser,
  confirmRenewalApiKeyMiddleware.checkUserPassword,
  confirmRenewalApiKeyMiddleware.createRenewalToken,
  confirmRenewalApiKeyMiddleware.createNewApiKey,
  confirmRenewalApiKeyMiddleware.createNewApiKeyHash,
  confirmRenewalApiKeyMiddleware.findAndUpdateRenewalApiKey,
  confirmRenewalApiKeyMiddleware.sendEmail,
  confirmRenewalApiKeyMiddleware.createAdminNotification,
  confirmRenewalApiKeyMiddleware.createUserNotification,
  confirmRenewalApiKeyMiddleware.generateResponse,
];

/**
 * Deleting a selected API key middleware
 */
export const deleteSelectedApiKey = [
  deleteSelectedApiKeyMiddleware.defineIdUser,
  deleteSelectedApiKeyMiddleware.checkIdUserForAdmin,
  deleteSelectedApiKeyMiddleware.findApiKeyAndUpdate,
  deleteSelectedApiKeyMiddleware.checkAndDeleteIfLastApiKey,
  deleteSelectedApiKeyMiddleware.createUserNotification,
  deleteSelectedApiKeyMiddleware.generateResponse,
];

