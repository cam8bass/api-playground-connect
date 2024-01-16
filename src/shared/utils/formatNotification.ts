import {
  NotificationDetailInterface,
  NotificationInterface,
} from "../interfaces";


export const formatNotification = (
  notification: NotificationInterface
): NotificationDetailInterface => {
  const lastNotification =
    notification.notifications[notification.notifications.length - 1];

  return {
    _id: lastNotification._id,
    createAt: lastNotification.createAt,
    read: lastNotification.read,
    readAt: lastNotification.readAt,
    type: lastNotification.type,
    message:
      lastNotification.message[0].toUpperCase() +
      lastNotification.message.slice(1),
  };
};
