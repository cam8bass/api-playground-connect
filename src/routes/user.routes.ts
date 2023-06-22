import { Router } from "express";
import * as adminController from "./../controllers/admin.controller";
import * as userController from "./../controllers/user.controller";
import * as authController from "./../controllers/auth.controller";
import apiKeyRouter from "./apiKey.routes";

const router = Router();

// USER ROUTES
// ====================================

// SIGNUP
router.post("/signup", userController.signUp);

// ACTIVATION ACCOUNT
router.patch("/activationAccount/:token", userController.activationAccount);

// LOGIN
router.post("/login", authController.accountIsLocked, userController.login);

// FORGOT PASSWORD
router.post("/forgotPassword", userController.forgotPassword);

// RESET PASSWORD
router.patch("/resetPassword/:token", userController.resetPassword);

// RESET EMAIL
router.patch("/resetEmail/:token", userController.changeEmail);

// ====================================
router.use(authController.protect, authController.accountIsLocked);

// UPDATE PASSWORD
router.patch("/updatePassword", userController.updatePassword);

// GET ME
router.get("/me", userController.getMe);

// UPDATE USER PROFILE
router.patch("/updateProfile", userController.updateUserProfile);

// CHANGE EMAIL
router.post("/changeEmail", userController.resetEmail);

// DISABLE ACCOUNT
router.delete("/disableAccount", userController.disableUserAccount);

// ADMIN ROUTES
// ====================================
router.use(authController.restrictTo("admin"));

router.route("/").get(adminController.getAllUsers);

router
  .route("/:id")
  .get(adminController.getUser)
  .patch(adminController.updateUser)
  .delete(adminController.deleteUser);

// NESTED ROUTES

// DELETE SELECTED API KEY
router.use("/:id", apiKeyRouter);

export default router;
