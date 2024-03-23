import { UserInterface } from "../interfaces";
import { userRoleType } from "../types/types";

/**
 * Formats a user object for the response
 * @param {UserInterface | UserInterface[]} user - The user object or array of user objects to format
 * @param {userRoleType} userType - The type of user to format, either "user" or "admin"
 * @returns {Partial<UserInterface> | Partial<UserInterface>[]} The formatted user object or array of user objects
 */
export function formatUserResponse(
  user: UserInterface | UserInterface[],
  userType: userRoleType
): Partial<UserInterface> | Partial<UserInterface>[] {
  if (Array.isArray(user)) {
    return user.map((singleUser) => formatUser(singleUser, userType));
  }

  return formatUser(user, userType);
}

/**
 * Formats a single user object
 * @param {UserInterface} user - The user object to format
 * @param {userRoleType} userType - The type of user to format, either "user" or "admin"
 * @returns {Partial<UserInterface>} The formatted user object
 */
export function formatUser(
  user: UserInterface,
  userType: userRoleType
): Partial<UserInterface> {
  const commonFields: Partial<UserInterface> = {
    _id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    active: user.active,
    role: user.role,
    accountLocked: user.accountLocked,
  };

  if (userType === "user") {
    return commonFields;
  }

  if (userType === "admin") {
    return {
      ...commonFields,
      createdAt: user.createdAt,
      loginFailures: user.loginFailures,
      disableAccountAt: user.disableAccountAt,
      emailChangeAt: user.emailChangeAt,
      passwordChangeAt: user.passwordChangeAt,
      activationAccountAt: user.activationAccountAt,
      accountLockedExpire: user.accountLockedExpire,
    };
  }

  return {};
}
