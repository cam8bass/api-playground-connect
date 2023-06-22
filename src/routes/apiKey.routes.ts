import { Router } from "express";
import * as authController from "./../controllers/auth.controller";
import * as apiKeyController from "./../controllers/apiKey.controller";
import * as adminController from "./../controllers/admin.controller";

const router = Router({ mergeParams: true });

// USER

// API KEY CONFIRM RENEWAL
router.patch("/confirmRenewal/:token", apiKeyController.confirmRenewalApiKey);

router.use(authController.protect, authController.accountIsLocked);

// DELETE SELECTED API KEY
router.delete("/deleteApiKey/:idApi", apiKeyController.deleteSelectedApiKey);

// API KEY RENEWAL REQUEST
router.patch(
  "/renewal/:idApi",
  authController.restrictTo("user"),
  apiKeyController.apiKeyRenewalRequest
);

router
  .route("/")
  .get(authController.restrictTo("admin"), adminController.getAllApiKeys)
  .post(
    authController.restrictTo("user"),
    apiKeyController.apiKeyCreationRequest
  );

// ADMIN
router.use(authController.restrictTo("admin"));

router
  .route("/:id")
  .get(adminController.getApiKey)
  .patch()
  .delete(adminController.deleteAllApiKeysFromUser);

// NESTED ROUTES

// ACTIVE API KEY
router.patch("/activeApiKey/:idApi", adminController.createApiKey);


export default router;
