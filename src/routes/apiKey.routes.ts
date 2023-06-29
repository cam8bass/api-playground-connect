import { Router } from "express";
import * as authController from "./../controllers/auth.controller";
import * as apiKeyController from "./../controllers/apiKey.controller";

const router = Router({ mergeParams: true });

// API KEY CONFIRM RENEWAL
router.patch("/confirmRenewal/:token", apiKeyController.confirmRenewalApiKey);

router.use(
  authController.protect,
  authController.accountIsLocked,
  authController.accountIsLocked,
  authController.restrictTo("user")
);

// DELETE SELECTED API KEY
router.delete("/deleteApiKey/:idApi", apiKeyController.deleteSelectedApiKey);

// API KEY RENEWAL REQUEST
router.patch(
  "/renewal/:idApi",
  authController.restrictTo("user"),
  apiKeyController.apiKeyRenewalRequest
);

router.route("/").post(apiKeyController.apiKeyCreationRequest);

export default router;
