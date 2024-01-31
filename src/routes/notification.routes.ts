import { Router } from "express";
import * as authController from "./../controllers/auth.controller";
import * as notificationController from "./../controllers/notification.controller";
const router = Router();

router.use(
  authController.protect,
  authController.checkAccountActive,
  authController.checkAccountLocked,
  authController.checkAccountDisabled
);

router.get("/myNotifications", notificationController.getMyNotification);

router.delete(
  "/deleteAllNotifications/:id",
  notificationController.deleteAllNotifications
);

router.patch(
  "/updateNotification/:idNotification",
  notificationController.updateNotification
);

router.patch(
  "/updateAllNotification",
  notificationController.updateAllNotification
);

router.patch(
  "/deleteSelectedNotification/:idNotification",
  notificationController.deleteSelectedNotification
);

router.patch(
  "/updateViewNotification/:idNotification",
  notificationController.updateViewNotification
);

export default router;
