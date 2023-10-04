import { notificationInterface } from "../interfaces";
import { notificationType } from "../types/types";

/**
 *
 * @param {notificationType} type - Le type de la notification (success ou fail)
 * @param {string} message - Le message de la notification
 * @return {notificationInterface} L'objet de notification
 */

export const createNotification = (
  type: notificationType,
  message: string
): notificationInterface => {
  return {
    type,
    message,
  };
};
