import { Router } from "express";
import * as authController from "./../controllers/auth.controller";
import * as apiKeyController from "./../controllers/apiKey.controller";

const router = Router({ mergeParams: true });

// API KEY CONFIRM RENEWAL
router.patch(
  "/confirmRenewal/:token",
  authController.accountIsActive,
  authController.accountIsLocked,
  apiKeyController.confirmRenewalApiKey
);

router.use(
  authController.protect,
  authController.accountIsActive,
  authController.accountIsLocked,
  authController.restrictTo("user")
);

// DELETE SELECTED API KEY
router.delete("/deleteApiKey/:idApi", apiKeyController.deleteSelectedApiKey);

// API KEY RENEWAL REQUEST
router.patch("/renewal/:idApi", apiKeyController.apiKeyRenewalRequest);

router.route("/").post(apiKeyController.apiKeyCreationRequest);

export default router;
