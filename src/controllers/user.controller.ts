import {
  activationAccountServices,
  confirmChangeEmailServices,
  disableUserAccountServices,
  emailChangeRequestServices,
  forgotPasswordServices,
  getMeServices,
  loginServices,
  logoutServices,
  resetPasswordServices,
  signupServices,
  updatePasswordServices,
  updateProfileServices,
} from "../services/user";

/**
 * Login middleware
 */
export const login = [
  loginServices.validateFields,
  loginServices.verifyUser,
  loginServices.verifyPassword,
  loginServices.checkIfTokenExpire,
  loginServices.checkIfAccountIsDisable,
  loginServices.sendEmailIfAccountDisable,
  loginServices.createAdminNotificationIfAccountDisable,
  loginServices.generateErrorSendEmailIfAccountDisable,
  loginServices.createResetToken,
  loginServices.prepareAccountForActivation,
  loginServices.createResetUrl,
  loginServices.sendEmail,
  loginServices.createAdminNotification,
  loginServices.deleteToken,
  loginServices.generateErrorSendEmailIfInactiveAccount,
  loginServices.createUserNotification,
  loginServices.generateResponseIfInactiveAccount,
  loginServices.createAndSendTokenIfActiveAccount,
  loginServices.generateResponseIfActiveAccount,
];

/**
 * Confirm activation account middleware
 */
export const confirmActivationAccount = [
  activationAccountServices.validateFields,
  activationAccountServices.createRandomToken,
  activationAccountServices.findUserWithToken,
  activationAccountServices.verifyPasswordField,
  activationAccountServices.updateUser,
  activationAccountServices.createAndSendToken,
  activationAccountServices.sendEmail,
  activationAccountServices.createAdminNotification,
  activationAccountServices.createUserNotification,
  activationAccountServices.generateResponse,
];

/**
 * Confirm change email middleware
 */

export const confirmChangeEmail = [
  confirmChangeEmailServices.validateFields,
  confirmChangeEmailServices.createTokenHash,
  confirmChangeEmailServices.findUser,
  confirmChangeEmailServices.verifyPasswordField,
  confirmChangeEmailServices.updateUser,
  confirmChangeEmailServices.createAndSendToken,
  confirmChangeEmailServices.sendEmail,
  confirmChangeEmailServices.createAdminNotification,
  confirmChangeEmailServices.createUserNotification,
  confirmChangeEmailServices.generateResponse,
];

/**
 * Disable user account middleware
 *
 */
export const disableUserAccount = [
  disableUserAccountServices.findUser,
  disableUserAccountServices.sendEmail,
  disableUserAccountServices.createAdminNotification,
  disableUserAccountServices.createUserNotification,
  disableUserAccountServices.clearJwtToken,
  disableUserAccountServices.generateResponse,
];

/**
 * The email change request middleware
 */
export const emailChangeRequest = [
  emailChangeRequestServices.createResetToken,
  emailChangeRequestServices.findUserAndUpdateResetToken,
  emailChangeRequestServices.createResetUrl,
  emailChangeRequestServices.sendEmail,
  emailChangeRequestServices.createAdminNotification,
  emailChangeRequestServices.deleteResetToken,
  emailChangeRequestServices.generateErrorSendEmail,
  emailChangeRequestServices.createUserNotification,
  emailChangeRequestServices.generateResponse,
];

/**
 * Forgot password middleware
 */
export const forgotPassword = [
  forgotPasswordServices.validateField,
  forgotPasswordServices.generateResetRandomToken,
  forgotPasswordServices.findAndUpdateUser,
  forgotPasswordServices.createResetUrl,
  forgotPasswordServices.sendEmail,
  forgotPasswordServices.deleteResetToken,
  forgotPasswordServices.createAdminNotification,
  forgotPasswordServices.generateErrorSendEmail,
  forgotPasswordServices.createUserNotification,
  forgotPasswordServices.generateResponse,
];

/**
 * Export get me  middleware
 */
export const getMe = [
  getMeServices.retrieveToken,
  getMeServices.checkTokenExistence,
  getMeServices.verifyToken,
  getMeServices.findUser,
  getMeServices.generateResponse,
];

/**
 * The logout middleware function.
 */
export const logout = [
  logoutServices.deleteCookie,
  logoutServices.generateReponse,
];

/**
 * Reset password middleware
 */
export const resetPassword = [
  resetPasswordServices.validateFields,
  resetPasswordServices.generateHashRandomToken,
  resetPasswordServices.findUserByResetToken,
  resetPasswordServices.changeUserPassword,
  resetPasswordServices.sendEmail,
  resetPasswordServices.createAdminNotification,
  resetPasswordServices.createUserNotification,
  resetPasswordServices.generateResponse,
];

/**
 * The sign up middleware array
 */
export const signUp = [
  signupServices.filteredBody,
  signupServices.createUser,
  signupServices.createUserNotification,
  signupServices.generateResponse,
];

/**
 * Export update password middleware
 */
export const updatePassword = [
  updatePasswordServices.validateFields,
  updatePasswordServices.findUserUpdatePassword,
  updatePasswordServices.verifyCurrentPassword,
  updatePasswordServices.changePasswordUser,
  updatePasswordServices.createAndSendToken,
  updatePasswordServices.sendEmail,
  updatePasswordServices.createAdminNotification,
  updatePasswordServices.createUserNotification,
  updatePasswordServices.generateResponse,
];

/**
 * The update user profile middleware.
 */
export const updateUserProfile = [
  updateProfileServices.checkPasswordPresence,
  updateProfileServices.filteredRequestBody,
  updateProfileServices.findAndUpdateUserProfile,
  updateProfileServices.createAndSendToken,
  updateProfileServices.takeModifiedFields,
  updateProfileServices.createUserNotification,
  updateProfileServices.generateResponse,
];
