import { Router } from "express";
import * as adminController from "./../controllers/admin.controller";
import * as authController from "./../controllers/auth.controller";
import * as apiKeyController from "./../controllers/apiKey.controller";

const router = Router();

router.use(
  authController.protect,
  authController.accountIsActive,
  authController.accountIsLocked,
  authController.restrictTo("admin")
);
router.get("/getUserApiKeys/:idUser", adminController.getSelectedUserApiKeys);
router.get("/getInactiveApiKeys", adminController.getAllInactiveApiKeys);
router.get("/getAccountsLocked", adminController.getAllLockedAccounts);

// USER ROUTES

router
  .route("/users")
  .get(adminController.getAllUsers)
  .post(adminController.createUser);

router
  .route("/users/:id")
  .get(adminController.getUser)
  .patch(adminController.updateUser)
  .delete(adminController.deleteUser);

// API KEYS ROUTES
router
  .route("/apiKeys")
  .get(adminController.getAllApiKeys)
  .post(adminController.createApiKey);

router
  .route("/apiKeys/:id")
  .get(adminController.getApiKey)
  .delete(adminController.deleteAllApiKeysFromUser);

// ACTIVE API KEY
router.patch(
  "/users/:id/apiKeys/activeApiKey/:idApi",
  adminController.activeAndcreateApiKey
);

// DELETE SELECTED API KEY FOR USER
router.delete(
  "/users/:id/apiKeys/deleteApiKey/:idApi",
  apiKeyController.deleteSelectedApiKey
);

export default router;
