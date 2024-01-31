import { Router } from "express";
import * as userController from "./../controllers/user.controller";
import * as authController from "./../controllers/auth.controller";
import apiKeyRouter from "./apiKey.routes";

const router = Router();

// SIGNUP
router.post("/signup", userController.signUp);

router.get("/me", userController.getMe);

// RESET PASSWORD
router.patch(
  "/resetPassword/:token",
  authController.findUserAccount,
  authController.checkAccountLocked,
  userController.resetPassword
);

// RESET EMAIL
router.patch(
  "/resetEmail/:token",
  authController.findUserAccount,
  authController.checkAccountLocked,
  userController.confirmChangeEmail
);

// FORGOT PASSWORD
router.post(
  "/forgotPassword",
  authController.findUserAccount,
  authController.checkAccountLocked,
  userController.forgotPassword
);

// ACTIVATION ACCOUNT
router.patch(
  "/activationAccount/:token",
  authController.findUserAccount,
  authController.checkAccountLocked,
  userController.confirmActivationAccount
);

// LOGIN
router.post("/login", userController.login);

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
router.use("/:id", apiKeyRouter);

export default router;
