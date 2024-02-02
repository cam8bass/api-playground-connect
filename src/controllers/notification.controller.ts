import * as factory from "../middlewares/factory";
import { Notification } from "../models";
import {
  getMyNotificationMiddleware,
  updateNotificationMiddleware,
  updateAllNotificationMiddleware,
  deleteSelectedNotificationMiddleware,
  updateViewNotificationMiddleware,
  deleteAllNotificationMiddleware,
} from "../middlewares/notification";

// /**
//  * Get current user notification middleware
//  */
export const getMyNotification = [
  getMyNotificationMiddleware.findNotification,
  getMyNotificationMiddleware.generateResponse,
];

/**
 * Update read status of a notification middleware
 */
export const updateNotification = [
  updateNotificationMiddleware.findAndUpdateNotification,
  updateNotificationMiddleware.generateResponse,
];

/**
 * Update all notification middleware
 */
export const updateAllNotification = [
  updateAllNotificationMiddleware.findAndUpdateAllNotification,
  updateAllNotificationMiddleware.generateResponse,
];

/**
 * An array of middleware functions that delete a selected notification and generate a response.
 */
export const deleteSelectedNotification = [
  deleteSelectedNotificationMiddleware.findAndDeleteSelectedNotification,
  deleteSelectedNotificationMiddleware.generateResponse,
];

/**
 * @description
 * Update view status of a notification
 */

export const updateViewNotification = [
  updateViewNotificationMiddleware.findAndUpdateNotification,
  updateViewNotificationMiddleware.generateResponse,
];

export const getAllNotifications = factory.getAll(Notification);

export const getNotification = factory.getOne(Notification);

/**
 * Delete all notifications to user middleware
 */
export const deleteAllNotification = [
  deleteAllNotificationMiddleware.findAndDeleteAllUserNotifications,
  deleteAllNotificationMiddleware.generateResponse,
];
