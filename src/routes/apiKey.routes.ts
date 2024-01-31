import { Router } from "express";
import * as authController from "./../controllers/auth.controller";
import * as apiKeyController from "./../controllers/apiKey.controller";

const router = Router({ mergeParams: true });

// API KEY CONFIRM RENEWAL
router.patch(
  "/confirmRenewal/:token",
  authController.findUserAccount,
  authController.checkAccountActive,
  authController.checkAccountLocked,
  apiKeyController.confirmRenewalApiKey
);

router.use(
  authController.protect,
  authController.checkAccountActive,
  authController.checkAccountLocked,
  authController.checkAccountDisabled,
  authController.restrictTo("user")
);

router
  .route("/")
  .post(apiKeyController.apiKeyCreationRequest)
  .get(apiKeyController.getMyApikey);

// DELETE SELECTED API KEY
router.delete("/deleteApiKey/:idApi", apiKeyController.deleteSelectedApiKey);

// API KEY RENEWAL REQUEST
router.patch("/renewal/:idApi", apiKeyController.apiKeyRenewalRequest);

export default router;
