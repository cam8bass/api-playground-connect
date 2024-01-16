import * as factory from "./factory.controller";
import Notification from "../models/notification.model";
import {
  getMyNotificationServices,
  updateNotificationServices,
  updateAllNotificationServices,
  deleteSelectedNotificationServices,
} from "../services/notification";

// /**
//  * Get current user notification middleware
//  */
export const getMyNotification = [
  getMyNotificationServices.findNotification,
  getMyNotificationServices.generateResponse,
];

/**
 * Update read status of a notification middleware
 */
export const updateNotification = [
  updateNotificationServices.findAndUpdateNotification,
  updateNotificationServices.generateResponse,
];

/**
 * Update all notification middleware
 */
export const updateAllNotification = [
  updateAllNotificationServices.findAndUpdateAllNotification,
  updateAllNotificationServices.generateResponse,
];

/**
 * An array of middleware functions that delete a selected notification and generate a response.
 */
export const deleteSelectedNotification = [
  deleteSelectedNotificationServices.findAndDeleteSelectedNotification,
  deleteSelectedNotificationServices.generateResponse,
];

export const getAllNotifications = factory.getAll(Notification);

export const getNotification = factory.getOne(Notification);

export const deleteAllNotifications = factory.deleteOne(
  Notification,
  "notification"
);
