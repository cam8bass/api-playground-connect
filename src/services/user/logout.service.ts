import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/utils/catchAsync.utils";


/**
 * Deletes the JWT cookie from the response.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function in the route's middleware chain.
 */
export const deleteCookie = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("jwt", "", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      sameSite: "strict",
    });
    next();
  }
);

/**
 * Generates a response with a status of 200.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function in the route's middleware chain.
 */
export const generateReponse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).end();
  }
);

// /**
//  * The logout middleware function.
//  */
// export const logout = [deleteCookie, generateReponse];
