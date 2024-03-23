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
  authController.checkRequestParams,
  notificationController.deleteAllNotification
);

router.patch(
  "/updateNotification/:id",
  authController.checkRequestParams,
  notificationController.updateNotification
);

router.patch(
  "/updateAllNotification",
  notificationController.updateAllNotification
);

router.patch(
  "/deleteSelectedNotification/:id",
  authController.checkRequestParams,
  notificationController.deleteSelectedNotification
);

router.patch(
  "/updateViewNotification/:id",
  authController.checkRequestParams,
  notificationController.updateViewNotification
);

export default router;
