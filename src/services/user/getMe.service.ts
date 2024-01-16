import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../shared/utils/catchAsync.utils";
import client from "../../infisical";
import User from "../../models/user.model";
import { UserInterface } from "../../shared/interfaces";
import { formatUserResponse } from "../../shared/utils/formatResponse.utils";
import { jsonResponse } from "../../shared/utils/jsonResponse.utils";

interface CustomRequestInterface extends Request {
  decoded?: jwt.JwtPayload;
  token?: string;
  currentUser?: UserInterface;
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

    const currentUser = await User.findOne({
      _id: decoded.id,
    });

    if (
      !currentUser ||
      currentUser.checkPasswordChangedAfterToken(decoded.iat) ||
      currentUser.checkEmailChangedAfterToken(decoded.iat)
    ) {
      return res.status(204).end();
    }

    req.currentUser = currentUser;
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
    const { currentUser } = req;

    res
      .status(200)
      .json(jsonResponse({ data: formatUserResponse(currentUser, "user") }));
  }
);

// /**
//  * Export get me  middleware
//  */
// export const getMe = [
//   retrieveToken,
//   checkTokenExistence,
//   verifyToken,
//   findUser,
//   generateResponse,
// ];
