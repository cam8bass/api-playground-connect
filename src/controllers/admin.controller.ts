import User from "../models/user.model";
import ApiKey from "../models/apiKey.model";
import * as factory from "./factory.controller";
import {
  updateUserServices,
  activeApiKeyServices,
  getAllInactiveApiKeysServices,
  getUserStatsServices,
  getSelectedUserApiKeysServices,
} from "../services/admin";

// USERS
export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);

export const createUser = factory.createOne(User, "user");

export const deleteUser = factory.deleteOne(User, "user");

/**
 * Update user middleware
 */
export const updateUser = [
  updateUserServices.filteredRequestBody,
  updateUserServices.takeModifiedFields,
  updateUserServices.findAndUpdateUser,
  updateUserServices.createUserNotification,
  updateUserServices.generateResponse,
];

/**
 * getUsersStats - This is an array of functions that are used to find the total number of users, active accounts, inactive accounts, disabled accounts, and locked accounts.
 */
export const getUsersStats = [
  getUserStatsServices.findUsersStats,
  getUserStatsServices.generateReponse,
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
  activeApiKeyServices.validateField,
  activeApiKeyServices.createNewApiKey,
  activeApiKeyServices.createApiKeyHash,
  activeApiKeyServices.findUserAndUpdateIfActive,
  activeApiKeyServices.sendEmailIfActive,
  activeApiKeyServices.createUserNotificationIfActive,
  activeApiKeyServices.generateResponseIfActive,
  activeApiKeyServices.findAndUpdateUserIfInactive,
  activeApiKeyServices.findAndDeleteIfInactive,
  activeApiKeyServices.sendEmailIfInactive,
  activeApiKeyServices.createUserNotificationIfInactive,
  activeApiKeyServices.generateReponseIfInactive,
];

/**
 * Get all inactive api keys middleware
 */
export const getAllInactiveApiKeys = [
  getAllInactiveApiKeysServices.findAllInactiveApiKeys,
  getAllInactiveApiKeysServices.generateResponse,
];

/**
 * An array of middleware functions that are used to fetch the ApiKeys and generate a response
 */
export const getSelectedUserApiKeys = [
  getSelectedUserApiKeysServices.findUserApiKeys,
  getSelectedUserApiKeysServices.generateResponse,
];
