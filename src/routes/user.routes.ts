import { Router } from "express";
import * as userController from "./../controllers/user.controller";
import * as authController from "./../controllers/auth.controller";
import apiKeyRouter from "./apiKey.routes";

const router = Router();

router.post("/signup", userController.signUp);
router.post("/login", userController.login);

router.get("/me", userController.getMe);

router.post(
  "/forgotPassword",
  authController.findUserAccount,
  authController.checkAccountLocked,
  userController.forgotPassword
);
router.patch(
  "/resetPassword/:token",
  authController.checkRequestParams,
  authController.findUserAccount,
  authController.checkAccountLocked,
  userController.resetPassword
);

// RESET EMAIL
router.patch(
  "/resetEmail/:token",
  authController.checkRequestParams,
  authController.findUserAccount,
  authController.checkAccountLocked,
  userController.confirmChangeEmail
);

// ACTIVATION ACCOUNT
router.patch(
  "/activationAccount/:token",
  authController.checkRequestParams,
  authController.findUserAccount,
  authController.checkAccountLocked,
  userController.confirmActivationAccount
);

// === NEED AUTH ===

router.use(
  authController.protect,
  authController.checkAccountActive,
  authController.checkAccountLocked,
  authController.checkAccountDisabled
);

// UPDATE PASSWORD
router.patch("/updatePassword", userController.updatePassword);

// UPDATE USER PROFILE
router.patch("/updateProfile", userController.updateUserProfile);

// CHANGE EMAIL
router.post("/changeEmail", userController.emailChangeRequest);

// DISABLE ACCOUNT
router.delete("/disableAccount", userController.disableUserAccount);

// LOGOUT
router.get("/logout", userController.logout);

// === ONLY USERS ===
router.use(authController.restrictTo("user"));

// NESTED ROUTES
// DELETE SELECTED API KEY
router.use("/:idUser", authController.checkRequestParams, apiKeyRouter);

export default router;
