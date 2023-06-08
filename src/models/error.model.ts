import { Response } from "express";
import { AppErrorInterface } from "../shared/interfaces";
import AppError from "../shared/utils/AppError.utils";
import { USER_EXPIRE, USER_PROTECT } from "../shared/messages";

export const handleCastError = (err: any): AppError => {
  const message = `Désolé, une erreur est survenue. L'url attend une donnée de type ${err.path}. Veuillez vérifier: ${err.value} ou essayer une autre requête`;
  return new AppError(message, 404);
};

export const handleValidationError = (err: any): AppError => {
  const value = Object.values(err.errors).map((el: any) => el.message);

  return new AppError(
    `Désolé, la validation a échoué en raison de champs obligatoires manquants. Veuillez vérifier les champs suivants :${value.join(
      ", "
    )} `,
    400
  );
};

export const handleDuplicateError = (err: any): AppError => {
  const value = (err.message as string)
    .match(/{[^}]+}/)
    .at(0)
    .replace(/[\\"{}]/g, "");
  const message = `Désolé, une erreur est survenue lors de la création de l'élément. Un élément possède déjà la valeur: ${value.trim()} Veuillez vérifier les données saisies et réessayer.`;
  return new AppError(message, 400);
};

export const handleJsonWebTokenError = (err: any): AppError => {
  return new AppError(USER_PROTECT, 401);
};

export const handleTokenExpiredError = (err: any): AppError => {
  return new AppError(USER_EXPIRE, 401);
};

export const handleErrorDev = (error: AppErrorInterface, res: Response) => {
  res.status(error.statusCode).json({
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

export const handleErrorProd = (error: AppErrorInterface, res: Response) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Une erreur s'est produite. Veuillez réessayer plus tard.",
    });
  }
};
