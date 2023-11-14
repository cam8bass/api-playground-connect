import { UserInterface } from "../interfaces";
import { userRoleType } from "../types/types";

export function formatUserResponse(
  user: UserInterface | UserInterface[],
  userType: userRoleType
): Partial<UserInterface> | Partial<UserInterface>[] {
  if (Array.isArray(user)) {
    return user.map((singleUser) => formatUser(singleUser, userType));
  }

  return formatUser(user, userType);
}


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
      createAt: user.createAt,
      loginFailures: user.loginFailures,
      disableAccountAt: user.disableAccountAt,
      emailChangeAt: user.emailChangeAt,
      emailResetTokenExpire: user.emailResetTokenExpire,
      passwordChangeAt: user.passwordChangeAt,
      passwordResetTokenExpire: user.passwordResetTokenExpire,
      activationAccountAt: user.activationAccountAt,
      activationAccountTokenExpire: user.activationAccountTokenExpire,
      accountLockedExpire: user.accountLockedExpire,
    };
  }

  return {};
}
