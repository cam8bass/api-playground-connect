import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * A middleware function that returns a new middleware function that wraps the
 * given function fn and handles any errors that occur within it by passing them
 * to the next middleware function in the stack.
 * @param {Function} fn - The function to be wrapped
 * @returns {RequestHandler} - A new middleware function that wraps the given function fn
 */
export function catchAsync(fn: Function): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
