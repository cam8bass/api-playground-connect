import {
  protectMiddleware,
  restrictToMiddleware,
  checkAccountActiveMiddleware,
  checkAccountLockedMiddleware,
  checkAccountDisabledMiddleware,
  findUserAccountMiddleware,
} from "../middlewares/auth";
import { userRoleType } from "../shared/types/types";

/**
 * @description
 * middleware to find user by email
 */
export const findUserAccount = [findUserAccountMiddleware.findUser];

/**
 * @description
 * middleware to protect routes that require authentication
 */
export const protect = [
  protectMiddleware.checkTokenExistence,
  protectMiddleware.verifyAndDecodeToken,
  protectMiddleware.findAndCheckUser,
];

/**
 * @description
 * middleware to restrict routes by role
 */
export const restrictTo = (...userRole: userRoleType[]) => [
  restrictToMiddleware.checkUserRole(...userRole),
];

/**
 * @description
 * Check if the user account is active middleware
 */
export const checkAccountActive = [
  checkAccountActiveMiddleware.checkUserIsLoggedIn,
  checkAccountActiveMiddleware.checkUserIsActive,
];

/**
 * @description
 * Check if the user account is locked
 */
export const checkAccountLocked = [
  checkAccountLockedMiddleware.checkUserIsLoggedIn,
  checkAccountLockedMiddleware.checkIfAccountIsLocked,
];

/**
 * @description
 * Check if the user account is disabled
 */
export const checkAccountDisabled = [
  checkAccountDisabledMiddleware.checkUserIsLoggedIn,
  checkAccountDisabledMiddleware.checkUserIsDisable,
];
