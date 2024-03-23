import {
  activationAccountMiddleware,
  confirmChangeEmailMiddleware,
  disableUserAccountMiddleware,
  emailChangeRequestMiddleware,
  forgotPasswordMiddleware,
  getMeMiddleware,
  logoutMiddleware,
  resetPasswordMiddleware,
  signupMiddleware,
  updatePasswordMiddleware,
  updateProfileMiddleware,
  loginCheckAccountMiddleware,
  loginCheckAccountIsLockedMiddleware,
  loginCheckAccountIsDisableMiddleware,
  loginCheckAccountIsActiveMiddleware,
  loginValidationMiddleware,
} from "../middlewares/user";

// /**
//  * Login middleware
//  */
export const login = [
  // find and valided fields
  loginCheckAccountMiddleware.validateFields,
  loginCheckAccountMiddleware.verifyUser,
  loginCheckAccountMiddleware.verifyPassword,
  loginCheckAccountMiddleware.updateLoginFailure,
  // check if account is locked
  loginCheckAccountIsLockedMiddleware.checkIfAccountIsLocked,
  loginCheckAccountIsLockedMiddleware.unlockAccount,
  loginCheckAccountIsLockedMiddleware.lockAccount,
  loginCheckAccountIsLockedMiddleware.generateErrorIfAccountLocked,
  loginCheckAccountIsLockedMiddleware.generateErrorWrongPassword,
  loginCheckAccountIsLockedMiddleware.createUserNotification,
  // check if account is disable
  loginCheckAccountIsDisableMiddleware.checkIfAccountIsDisable,
  loginCheckAccountIsDisableMiddleware.sendEmail,
  loginCheckAccountIsDisableMiddleware.createAdminNotification,
  loginCheckAccountIsDisableMiddleware.createUserNotification,
  // check if account is active
  loginCheckAccountIsActiveMiddleware.checkIfTokenExpire,
  loginCheckAccountIsActiveMiddleware.createResetToken,
  loginCheckAccountIsActiveMiddleware.findAndUpdateNewToken,
  loginCheckAccountIsActiveMiddleware.createResetUrl,
  loginCheckAccountIsActiveMiddleware.sendEmail,
  loginCheckAccountIsActiveMiddleware.createAdminNotification,
  loginCheckAccountIsActiveMiddleware.deleteToken,
  loginCheckAccountIsActiveMiddleware.generateErrorSendEmail,
  loginCheckAccountIsActiveMiddleware.createUserNotification,
  loginCheckAccountIsActiveMiddleware.generateResponse,
  // validate user login
  loginValidationMiddleware.createJwtToken,
  loginValidationMiddleware.createCookie,
  loginValidationMiddleware.generateResponse,
];
/**
 * Confirm activation account middleware
 */
export const confirmActivationAccount = [
  activationAccountMiddleware.validateFields,
  activationAccountMiddleware.createRandomToken,
  activationAccountMiddleware.findUserWithToken,
  activationAccountMiddleware.verifyPasswordField,
  activationAccountMiddleware.updateUser,
  activationAccountMiddleware.createJwtToken,
  activationAccountMiddleware.createCookie,
  activationAccountMiddleware.sendEmail,
  activationAccountMiddleware.createAdminNotification,
  activationAccountMiddleware.createUserNotification,
  activationAccountMiddleware.generateResponse,
];

/**
 * Confirm change email middleware
 */

export const confirmChangeEmail = [
  confirmChangeEmailMiddleware.validateFields,
  confirmChangeEmailMiddleware.createTokenHash,
  confirmChangeEmailMiddleware.findUser,
  confirmChangeEmailMiddleware.verifyPasswordField,
  confirmChangeEmailMiddleware.updateUser,
  confirmChangeEmailMiddleware.createJwtToken,
  confirmChangeEmailMiddleware.createCookie,
  confirmChangeEmailMiddleware.sendEmail,
  confirmChangeEmailMiddleware.createAdminNotification,
  confirmChangeEmailMiddleware.createUserNotification,
  confirmChangeEmailMiddleware.generateResponse,
];

/**
 * Disable user account middleware
 *
 */
export const disableUserAccount = [
  disableUserAccountMiddleware.findUser,
  disableUserAccountMiddleware.sendEmail,
  disableUserAccountMiddleware.createAdminNotification,
  disableUserAccountMiddleware.createUserNotification,
  disableUserAccountMiddleware.clearJwtToken,
  disableUserAccountMiddleware.generateResponse,
];

/**
 * The email change request middleware
 */
export const emailChangeRequest = [
  emailChangeRequestMiddleware.checkIfTokenExpire,
  emailChangeRequestMiddleware.createResetToken,
  emailChangeRequestMiddleware.findUserAndUpdateResetToken,
  emailChangeRequestMiddleware.createResetUrl,
  emailChangeRequestMiddleware.sendEmail,
  emailChangeRequestMiddleware.createAdminNotification,
  emailChangeRequestMiddleware.deleteEmailToken,
  emailChangeRequestMiddleware.generateErrorSendEmail,
  emailChangeRequestMiddleware.createUserNotification,
  emailChangeRequestMiddleware.generateResponse,
];

/**
 * Forgot password middleware
 */
export const forgotPassword = [
  forgotPasswordMiddleware.validateField,
  forgotPasswordMiddleware.generateResetRandomToken,
  forgotPasswordMiddleware.findUser,
  forgotPasswordMiddleware.checkIfResetToken,
  forgotPasswordMiddleware.AddTokenExpire,
  forgotPasswordMiddleware.createResetUrl,
  forgotPasswordMiddleware.sendEmail,
  forgotPasswordMiddleware.createAdminNotification,
  forgotPasswordMiddleware.deletePasswordToken,
  forgotPasswordMiddleware.generateErrorSendEmail,
  forgotPasswordMiddleware.createUserNotification,
  forgotPasswordMiddleware.generateResponse,
];

/**
 * Export get me  middleware
 */
export const getMe = [
  getMeMiddleware.retrieveToken,
  getMeMiddleware.checkTokenExistence,
  getMeMiddleware.verifyToken,
  getMeMiddleware.findUser,
  getMeMiddleware.generateResponse,
];

/**
 * The logout middleware function.
 */
export const logout = [
  logoutMiddleware.deleteCookie,
  logoutMiddleware.generateReponse,
];

/**
 * Reset password middleware
 */
export const resetPassword = [
  resetPasswordMiddleware.validateFields,
  resetPasswordMiddleware.generateHashRandomToken,
  resetPasswordMiddleware.findUserByResetToken,
  resetPasswordMiddleware.changeUserPassword,
  resetPasswordMiddleware.createJwtToken,
  resetPasswordMiddleware.createCookie,
  resetPasswordMiddleware.sendEmail,
  resetPasswordMiddleware.createAdminNotification,
  resetPasswordMiddleware.createUserNotification,
  resetPasswordMiddleware.generateResponse,
];

/**
 * The sign up middleware array
 */
export const signUp = [
  signupMiddleware.filteredBody,
  signupMiddleware.createResetToken,
  signupMiddleware.createUser,
  signupMiddleware.createResetUrl,
  signupMiddleware.sendEmail,
  signupMiddleware.createAdminNotification,
  signupMiddleware.generateErrorSendEmail,
  signupMiddleware.createUserNotification,
  signupMiddleware.generateResponse,
];

/**
 * Export update password middleware
 */
export const updatePassword = [
  updatePasswordMiddleware.validateFields,
  updatePasswordMiddleware.findUserUpdatePassword,
  updatePasswordMiddleware.verifyCurrentPassword,
  updatePasswordMiddleware.changePasswordUser,
  updatePasswordMiddleware.createJwtToken,
  updatePasswordMiddleware.createCookie,
  updatePasswordMiddleware.sendEmail,
  updatePasswordMiddleware.createAdminNotification,
  updatePasswordMiddleware.createUserNotification,
  updatePasswordMiddleware.generateResponse,
];

/**
 * The update user profile middleware.
 */
export const updateUserProfile = [
  updateProfileMiddleware.checkPasswordPresence,
  updateProfileMiddleware.filteredRequestBody,
  updateProfileMiddleware.findAndUpdateUserProfile,
  updateProfileMiddleware.createJwtToken,
  updateProfileMiddleware.createCookie,
  updateProfileMiddleware.takeModifiedFields,
  updateProfileMiddleware.createUserNotification,
  updateProfileMiddleware.generateResponse,
];
