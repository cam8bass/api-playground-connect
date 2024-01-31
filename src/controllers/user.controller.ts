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
  loginValidationMiddleware.createAndSendToken,
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
  activationAccountMiddleware.createAndSendToken,
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
  confirmChangeEmailMiddleware.createAndSendToken,
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
  emailChangeRequestMiddleware.createResetToken,
  emailChangeRequestMiddleware.findUserAndUpdateResetToken,
  emailChangeRequestMiddleware.createResetUrl,
  emailChangeRequestMiddleware.sendEmail,
  emailChangeRequestMiddleware.createAdminNotification,
  emailChangeRequestMiddleware.deleteResetToken,
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
  forgotPasswordMiddleware.findAndUpdateUser,
  forgotPasswordMiddleware.createResetUrl,
  forgotPasswordMiddleware.sendEmail,
  forgotPasswordMiddleware.deleteResetToken,
  forgotPasswordMiddleware.createAdminNotification,
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
  signupMiddleware.deleteToken,
  signupMiddleware.generateErrorSendEmail,
  signupMiddleware.createUserNotification,
  signupMiddleware.generateResponse,
];

// FIXME: OLD VERSION
// /**
//  * The sign up middleware array
//  */
// export const signUp = [
//   signupMiddleware.filteredBody,
//   signupMiddleware.createUser,
//   signupMiddleware.createUserNotification,
//   signupMiddleware.generateResponse,
// ];

/**
 * Export update password middleware
 */
export const updatePassword = [
  updatePasswordMiddleware.validateFields,
  updatePasswordMiddleware.findUserUpdatePassword,
  updatePasswordMiddleware.verifyCurrentPassword,
  updatePasswordMiddleware.changePasswordUser,
  updatePasswordMiddleware.createAndSendToken,
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
  updateProfileMiddleware.createAndSendToken,
  updateProfileMiddleware.takeModifiedFields,
  updateProfileMiddleware.createUserNotification,
  updateProfileMiddleware.generateResponse,
];
