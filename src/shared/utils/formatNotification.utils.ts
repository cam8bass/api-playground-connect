import { NotificationDetailInterface } from "../interfaces";

/**
 * Formats an array of notifications by removing duplicates.
 *
 * @param {NotificationDetailInterface[]} notification - An array of notifications.
 * @returns {NotificationDetailInterface[]} The formatted array of notifications.
 */
export function formatNotification(
  notification: NotificationDetailInterface[]
): NotificationDetailInterface[] {
  return Array.from(new Set([...notification]));
}
