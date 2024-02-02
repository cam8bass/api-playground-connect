import { NextFunction, Request, Response } from "express";
import { User } from "../../../models";
import { UserInterface } from "../../../shared/interfaces";
import { validationMessage, warningMessage, errorMessage } from "../../../shared/messages";
import { catchAsync, fieldErrorMessages, AppError } from "../../../shared/utils";


interface CustomRequestInterface extends Request {
  user?: UserInterface;
  accountIsLocked?: boolean;
  passwordIsCorrect?: boolean;
}

/**
 * Validate email and password fields
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const validateFields = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      const requiredFields = {
        email: validationMessage.VALIDATE_REQUIRED_FIELD("email"),
        password: validationMessage.VALIDATE_REQUIRED_FIELD("mot de passe"),
      };

      const errors = fieldErrorMessages({ email, password }, requiredFields);

      return next(
        new AppError(401, warningMessage.WARNING__REQUIRE_FIELD, errors)
      );
    }

    next();
  }
);

/**
 * Verify user for login
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const verifyUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne<UserInterface>({ email }).select(
      "+password"
    );

    if (!user) {
      return next(
        new AppError(
          401,
          warningMessage.WARNING_DOCUMENT_NOT_FOUND("utilisateur"),
          {
            request: errorMessage.ERROR_WRONG_LOGIN,
          }
        )
      );
    }

    req.user = user;

    next();
  }
);

/**
 * Verify password for login
 * @param {CustomRequestInterface} req - request object
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const verifyPassword = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { password } = req.body;
    const { user } = req;

    const passwordIsCorrect = await user.checkUserPassword(
      password,
      user.password
    );

    req.passwordIsCorrect = passwordIsCorrect;

    next();
  }
);

/**
 * Update the login failure count and lockout status for a user
 * @param {Response} res - response object
 * @param {NextFunction} next - next function
 * @returns {Promise<void>}
 */
export const updateLoginFailure = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { user, passwordIsCorrect } = req;

    await user.updateLoginFailure(passwordIsCorrect);

    next();
  }
);
