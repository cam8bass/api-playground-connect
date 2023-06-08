import { Router } from "express";
import * as adminController from "./../controllers/admin.controller";
import * as userController from "./../controllers/user.controller";

const router = Router();

// SIGNUP
router.post("/signup", userController.signUp);
// ACTIVATION ACCOUNT
router.patch("/activationAccount/:token", userController.activationAccount);
// LOGIN
router.post("/login", userController.accountIsLocked, userController.login);

router.route("/").get(adminController.getAllUsers);

router
  .route("/:id")
  .get(adminController.getUser)
  .patch(userController.updateUser)
  .delete(adminController.deleteUser);

export default router;
