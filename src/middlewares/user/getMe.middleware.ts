import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import client from "../../infisical";
import { User } from "../../models";
import { JwtDecodedInterface, UserInterface } from "../../shared/interfaces";
import {
  catchAsync,
  jsonResponse,
  formatUserResponse,
} from "../../shared/utils";

interface CustomRequestInterface extends Request {
  decoded?: JwtDecodedInterface;
  token?: string;
  user?: UserInterface;
}

/**
 * Retrieves the user from the request, if present.
 *
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function in the stack
 */
export const retrieveToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split("Bearer ").at(1);
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    req.token = token;

    next();
  }
);

/**
 * Verifies that a token is present in the request.
 *
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function in the stack
 */
export const checkTokenExistence = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    if (!req.token) {
      return res.status(204).end();
    }

    next();
  }
);

export const verifyToken = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { secretValue: jwtSecret } = await client.getSecret("JWT_SECRET");

    const decoded = jwt.verify(req.token!, jwtSecret) as JwtPayload;

    req.decoded = decoded;
    next();
  }
);

/**
 * Verifies the token and retrieves the user from the database.
 *
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function in the stack
 */
export const findUser = catchAsync(
  async (req: CustomRequestInterface, res: Response, next: NextFunction) => {
    const { decoded } = req;

    const user = await User.findOne({
      _id: decoded.idUser,
    });

    if (
      !user ||
      user.checkPasswordChangedAfterToken(decoded.iat) ||
      user.checkEmailChangedAfterToken(decoded.iat)
    ) {
      return res.status(204).end();
    }

    req.user = user;
    next();
  }
);

/**
 * Generates the response
 *
 * @param req - The request object
 * @param res - The response object
 */
export const generateResponse = catchAsync(
  async (req: CustomRequestInterface, res: Response) => {
    const { user } = req;

    return res
      .status(200)
      .json(jsonResponse({ data: formatUserResponse(user, "user") }));
  }
);
