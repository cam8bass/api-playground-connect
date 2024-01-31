import User from "../models/user.model";
import ApiKey from "../models/apiKey.model";
import * as factory from "../middlewares/factory";

import {
  updateUserMiddleware,
  activeApiKeyMiddleware,
  getAllInactiveApiKeysMiddleware,
  getUserStatsMiddleware,
  getSelectedUserApiKeysMiddleware,
} from "../middlewares/admin";

// USERS
export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);

export const createUser = factory.createOne(User, "user");

export const deleteUser = factory.deleteOne(User, "user");

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
export const getUsersStats = [
  getUserStatsMiddleware.findUsersStats,
  getUserStatsMiddleware.generateReponse,
];

// API KEYS
export const getAllApiKeys = factory.getAll(ApiKey);

export const getApiKey = factory.getOne(ApiKey);

export const createApiKey = factory.createOne(ApiKey, "apiKey");

export const deleteAllApiKeysFromUser = factory.deleteOne(ApiKey);

/**
 * Active api key middleware
 */
export const activeApiKey = [
  activeApiKeyMiddleware.validateField,
  activeApiKeyMiddleware.createNewApiKey,
  activeApiKeyMiddleware.createApiKeyHash,
  activeApiKeyMiddleware.findUserAndUpdateIfActive,
  activeApiKeyMiddleware.sendEmailIfActive,
  activeApiKeyMiddleware.createUserNotificationIfActive,
  activeApiKeyMiddleware.generateResponseIfActive,
  activeApiKeyMiddleware.findAndUpdateUserIfInactive,
  activeApiKeyMiddleware.findAndDeleteIfInactive,
  activeApiKeyMiddleware.sendEmailIfInactive,
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
