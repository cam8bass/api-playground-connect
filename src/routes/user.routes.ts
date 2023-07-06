import { Router } from "express";
import * as userController from "./../controllers/user.controller";
import * as authController from "./../controllers/auth.controller";
import apiKeyRouter from "./apiKey.routes";

const router = Router();

// SIGNUP
router.post("/signup", userController.signUp);

// ACTIVATION ACCOUNT
router.patch(
  "/activationAccount/:token",
  authController.accountIsLocked,
  userController.confirmActivationAccount
);

// LOGIN
router.post("/login", authController.accountIsLocked, userController.login);

// FORGOT PASSWORD
router.post("/forgotPassword", userController.forgotPassword);

// RESET PASSWORD
router.patch(
  "/resetPassword/:token",
  authController.accountIsLocked,
  userController.resetPassword
);

// RESET EMAIL
router.patch(
  "/resetEmail/:token",
  authController.accountIsLocked,
  userController.confirmChangeEmail
);

// === NEED AUTH ===

router.use(
  authController.protect,
  authController.accountIsActive,
  authController.accountIsLocked
);

// UPDATE PASSWORD
router.patch("/updatePassword", userController.updatePassword);

// GET ME
router.get("/me", userController.getMe);

// UPDATE USER PROFILE
router.patch("/updateProfile", userController.updateUserProfile);

// CHANGE EMAIL
router.post("/changeEmail", userController.emailChangeRequest);

// DISABLE ACCOUNT
router.delete("/disableAccount", userController.disableUserAccount);

// === ONLY USERS ===
router.use(authController.restrictTo("user"));

// NESTED ROUTES
// DELETE SELECTED API KEY
router.use("/:id", apiKeyRouter);

export default router;
