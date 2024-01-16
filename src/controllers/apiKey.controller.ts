import {
  apiKeyCreationRequestServices,
  apiKeyRenewalRequestServices,
  confirmRenewalApiKeyServices,
  deleteSelectedApiKeyServices,
  getMyApikeyServices,
} from "../services/apiKey";

/**
 * Get user api key middleware
 */
export const getMyApikey = [
  getMyApikeyServices.findApiKeys,
  getMyApikeyServices.generateReponse,
];

/**
 * user api key creation request middleware
 */
export const apiKeyCreationRequest = [
  apiKeyCreationRequestServices.verifyField,
  apiKeyCreationRequestServices.findUserAndCheckApiKeys,
  apiKeyCreationRequestServices.findAndUpdateNewApiKey,
  apiKeyCreationRequestServices.searchIdNewApi,
  apiKeyCreationRequestServices.sendEmail,
  apiKeyCreationRequestServices.createAdminNotificationIfErrorSendEmail,
  apiKeyCreationRequestServices.findAndDeleteApiKeyIfNotSendEmail,
  apiKeyCreationRequestServices.findAndDeleteDocumentIfLastApiKey,
  apiKeyCreationRequestServices.generateErrorIfNotSendEmail,
  apiKeyCreationRequestServices.createAdminNotification,
  apiKeyCreationRequestServices.createUserNotification,
  apiKeyCreationRequestServices.generateResponse,
];

/**
 * api key renewal request middleware
 */
export const apiKeyRenewalRequest = [
  apiKeyRenewalRequestServices.createResetToken,
  apiKeyRenewalRequestServices.findAndUpdateRenewalApiKey,
  apiKeyRenewalRequestServices.createResetUrlWithResetToken,
  apiKeyRenewalRequestServices.sendEmail,
  apiKeyRenewalRequestServices.createAdminNotification,
  apiKeyRenewalRequestServices.findAndUpdateRenewalToken,
  apiKeyRenewalRequestServices.generateErrorIfNotSendEmail,
  apiKeyRenewalRequestServices.createUserNotification,
  apiKeyRenewalRequestServices.generateResponse,
];

/**
 * user confirm renewal api key middleware
 */
export const confirmRenewalApiKey = [
  confirmRenewalApiKeyServices.verifyFields,
  confirmRenewalApiKeyServices.findUser,
  confirmRenewalApiKeyServices.checkUserPassword,
  confirmRenewalApiKeyServices.createRenewalToken,
  confirmRenewalApiKeyServices.createNewApiKey,
  confirmRenewalApiKeyServices.createNewApiKeyHash,
  confirmRenewalApiKeyServices.findAndUpdateRenewalApiKey,
  confirmRenewalApiKeyServices.sendEmail,
  confirmRenewalApiKeyServices.createAdminNotification,
  confirmRenewalApiKeyServices.createUserNotification,
  confirmRenewalApiKeyServices.generateResponse,
];

/**
 * Deleting a selected API key middleware
 */
export const deleteSelectedApiKey = [
  deleteSelectedApiKeyServices.defineIdUser,
  deleteSelectedApiKeyServices.checkIdUserForAdmin,
  deleteSelectedApiKeyServices.findApiKeyAndUpdate,
  deleteSelectedApiKeyServices.checkAndDeleteIfLastApiKey,
  deleteSelectedApiKeyServices.createUserNotification,
  deleteSelectedApiKeyServices.generateResponse,
];

