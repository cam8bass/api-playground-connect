import * as factory from "../middlewares/factory";
import { User, ApiKey } from "../models";
import {
  updateUserMiddleware,
  activeApiKeyMiddleware,
  getAllInactiveApiKeysMiddleware,
  getAllUserOverviewMiddleware,
  getSelectedUserApiKeysMiddleware,
  createApiKeyMiddleware,
  createNewUserMiddleware,
  deleteUserMiddleware,
  deleteAllApiKeysToUserMiddleware,
} from "../middlewares/admin";

// USERS
export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);

/**
 * Admin delete user middleware
 */
export const deleteUser = [
  deleteUserMiddleware.findUserAndDelete,
  deleteUserMiddleware.findAndDeleteUserApiKeys,
  deleteUserMiddleware.findAndDeleteUserNotifications,
  deleteUserMiddleware.sendEmail,
  deleteUserMiddleware.createAdminNotification,
  deleteUserMiddleware.generateResponse,
];

/**
 * Admin create new user middleware
 */

export const createUser = [
  createNewUserMiddleware.filteredBody,
  createNewUserMiddleware.createNewUser,
  createNewUserMiddleware.createAdminNotification,
  createNewUserMiddleware.createUserNotification,
  createNewUserMiddleware.generateResponse,
];

/**
 * Update user middleware
 */
export const updateUser = [
  updateUserMiddleware.filteredRequestBody,
  updateUserMiddleware.takeModifiedFields,
  updateUserMiddleware.findAndUpdateUser,
  updateUserMiddleware.createUserNotification,
  updateUserMiddleware.generateResponse,
];

/**
 * getUsersStats - This is an array of functions that are used to find the total number of users, active accounts, inactive accounts, disabled accounts, and locked accounts.
 */
export const getAllUserOverview = [
  getAllUserOverviewMiddleware.findUsersStats,
  getAllUserOverviewMiddleware.generateReponse,
];

// API KEYS
export const getAllApiKeys = factory.getAll(ApiKey);

export const getApiKey = factory.getOne(ApiKey);

/**
 * Admin delete API key middleware
 */
export const deleteAllApiKeysFromUser = [
  deleteAllApiKeysToUserMiddleware.findAndDeleteApiKeys,
  deleteAllApiKeysToUserMiddleware.createAdminNotification,
  deleteAllApiKeysToUserMiddleware.createUserNotification,
  deleteAllApiKeysToUserMiddleware.generateResponse,
];

/**
 * Create new api key middleware
 */
export const createApiKey = [
  createApiKeyMiddleware.validateFields,
  createApiKeyMiddleware.findAndCheckUserApiKeys,
  createApiKeyMiddleware.createNewApiKey,
  createApiKeyMiddleware.encryptNewApiKey,
  createApiKeyMiddleware.addNewApiKeyUser,
  createApiKeyMiddleware.sendEmail,
  createApiKeyMiddleware.createAdminNotification,
  createApiKeyMiddleware.createUserNotification,
  createApiKeyMiddleware.generateResponse,
];

/**
 * Active api key middleware
 */
export const activeApiKey = [
  activeApiKeyMiddleware.validateField,
  activeApiKeyMiddleware.createNewApiKey,
  activeApiKeyMiddleware.createApiKeyHash,
  activeApiKeyMiddleware.findUserAndUpdateIfActive,
  activeApiKeyMiddleware.sendEmailIfActive,
  activeApiKeyMiddleware.createAdminNotificationIfActive,
  activeApiKeyMiddleware.createUserNotificationIfActive,
  activeApiKeyMiddleware.generateResponseIfActive,
  activeApiKeyMiddleware.findAndUpdateUserIfInactive,
  activeApiKeyMiddleware.findAndDeleteIfInactive,
  activeApiKeyMiddleware.sendEmailIfInactive,
  activeApiKeyMiddleware.createAdminNotificationIfInactive,
  activeApiKeyMiddleware.createUserNotificationIfInactive,
  activeApiKeyMiddleware.generateReponseIfInactive,
];

/**
 * Get all inactive api keys middleware
 */
export const getAllInactiveApiKeys = [
  getAllInactiveApiKeysMiddleware.findAllInactiveApiKeys,
  getAllInactiveApiKeysMiddleware.generateResponse,
];

/**
 * An array of middleware functions that are used to fetch the ApiKeys and generate a response
 */
export const getSelectedUserApiKeys = [
  getSelectedUserApiKeysMiddleware.findUserApiKeys,
  getSelectedUserApiKeysMiddleware.generateResponse,
];
