import { Router } from "express";
import * as adminController from "./../controllers/admin.controller";
import * as userController from "./../controllers/user.controller";
import * as authController from "./../controllers/auth.controller";

const router = Router();

// SIGNUP
router.post("/signup", userController.signUp);

// ACTIVATION ACCOUNT
router.patch("/activationAccount/:token", userController.activationAccount);

// LOGIN
router.post("/login", authController.accountIsLocked, userController.login);

// USER ROUTES
router.use(
  authController.protect,
  authController.accountIsLocked,
  authController.restrictTo("admin")
);

router.route("/").get(adminController.getAllUsers);

router
  .route("/:id")
  .get(adminController.getUser)
  .patch(userController.updateUser)
  .delete(adminController.deleteUser);

export default router;
