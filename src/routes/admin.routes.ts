import { Router } from "express";
import * as adminController from "./../controllers/admin.controller";
import * as authController from "./../controllers/auth.controller";
import * as apiKeyController from "./../controllers/apiKey.controller";
import * as notificationController from "./../controllers/notification.controller";

const router = Router();

router.use(
  authController.protect,
  authController.checkAccountActive,
  authController.checkAccountLocked,
  authController.checkAccountDisabled,
  authController.restrictTo("admin")
);
router.get(
  "/getUserApiKeys/:idUser",
  authController.checkRequestParams,
  adminController.getSelectedUserApiKeys
);
router.get("/getInactiveApiKeys", adminController.getAllInactiveApiKeys);

router.get("/getAllUserOverview", adminController.getAllUserOverview);

// USER ROUTES

router
  .route("/users")
  .get(adminController.getAllUsers)
  .post(adminController.createUser);

router
  .route("/users/:id")
  .get(authController.checkRequestParams, adminController.getUser)
  .patch(authController.checkRequestParams, adminController.updateUser)
  .delete(authController.checkRequestParams, adminController.deleteUser);

// API KEYS ROUTES
router
  .route("/apiKeys")
  .get(adminController.getAllApiKeys)
  .post(adminController.createApiKey);

router
  .route("/apiKeys/:idApi")
  .get(authController.checkRequestParams, adminController.getApiKey)
  .delete(
    authController.checkRequestParams,
    adminController.deleteAllApiKeysFromUser
  );

// ACTIVE API KEY
router.patch(
  "/users/:idUser/apiKeys/activeApiKey/:idApi",
  authController.checkRequestParams,
  adminController.activeApiKey
);

// DELETE SELECTED API KEY FOR USER
router.delete(
  "/users/:idUser/apiKeys/deleteApiKey/:idApi",
  authController.checkRequestParams,
  apiKeyController.deleteSelectedApiKey
);

// NOTIFICATIONS ROUTES
router.route("/notifications").get(notificationController.getAllNotifications);

router
  .route("/notifications/:id")
  .get(
    authController.checkRequestParams,
    notificationController.getNotification
  );

export default router;
