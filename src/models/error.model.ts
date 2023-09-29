import { Response } from "express";
import { AppErrorInterface } from "../shared/interfaces";
import AppError from "../shared/utils/AppError.utils";
import { AppMessage } from "../shared/messages";

export const handleCastError = (err: any): AppError => {
  const message = `Désolé, une erreur est survenue. L'url attend une donnée de type ${err.path}. Veuillez vérifier: ${err.value} ou essayer une autre requête`;
  return new AppError(message, 404);
};

export const handleValidationError = (err: any): AppError => {
  const value = Object.values(err.errors).map((el: any) => el.message);
  const message = `Désolé, la validation a échoué en raison de champs obligatoires manquants. Veuillez vérifier les champs suivants : ${value.join(
    ", "
  )} `;

  const field = Object.keys(err.errors).reduce((acc, key) => {
    acc[key] = err.errors[key].message;
    return acc;
  }, {});

  return new AppError(message, 400, field);
};

export const handleDuplicateError = (err: any): AppError => {
  const value = (err.message as string)
    .match(/{[^}]+}/)
    .at(0)
    .replace(/[\\"{}]/g, "");
  const message = `Désolé, une erreur est survenue lors de la création de l'élément. Un élément possède déjà la valeur: ${value.trim()} Veuillez vérifier les données saisies et réessayer.`;

  const field = (err.message as string).matchAll(/(\w+): \"(.+?)\"/g);

  const obj = Object.fromEntries(
    Array.from(field, (match) => [match[1], `${match[2]} est déjà utilisé`])
  );

  return new AppError(message, 400, obj);
};

export const handleJsonWebTokenError = (): AppError => {
  return new AppError(AppMessage.errorMessage.ERROR_LOGIN_REQUIRED, 401);
};

export const handleTokenExpiredError = (): AppError => {
  return new AppError(AppMessage.errorMessage.ERROR_SESSION_EXPIRED, 401);
};

export const handleErrorDev = (error: AppErrorInterface, res: Response) => {
  res.status(error.statusCode).json({
    error: error,
    errors: error.data,
    message: error.message,
    stack: error.stack,
  });
};

export const handleErrorProd = (error: AppErrorInterface, res: Response) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      errors: error.data,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite. Veuillez réessayer plus tard.",
    });
  }
};
