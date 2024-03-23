import { json } from "stream/consumers";
import { AppErrorInterface } from "../shared/interfaces";
import { errorMessage } from "../shared/messages";
import { AppError } from "../shared/utils";
import { Response, Request } from "express";

export const handleCastError = (err: any, req: Request): AppError => {
  const message = `La requête a échoué en raison d'un format d'URL incorrect. L'url attend une donnée de type ${err.path}. Veuillez vérifier: ${err.value}`;

  return new AppError(req, {
    statusCode: 400,
    message,
  });
};

export const handleValidationError = (err: any, req: Request): AppError => {
  const value = Object.values(err.errors).map((el: any) => el.message);

  const message = `La requête a échoué en raison de données de formulaire incorrectes ou invalides. Veuillez vérifier les champs suivant du formulaire : ${value.join(
    ", "
  )} et réessayer.`;

  const field = Object.keys(err.errors).reduce((acc, key) => {
    acc[key] = err.errors[key].message;
    return acc;
  }, {});

  return new AppError(req, {
    statusCode: 400,
    message,
    fields: field,
  });
};

export const handleDuplicateError = (err: any, req: Request): AppError => {
  const value = (err.message as string)
    .match(/{[^}]+}/)
    .at(0)
    .replace(/[\\"{}]/g, "");

  const message = `"La requête a échoué en raison d'une duplication de données pour les champs : ${value.trim()}. L'élément que vous tentez de créer ou de modifier existe déjà dans notre système. Veuillez vérifier les détails que vous avez fournis et assurez-vous qu'ils sont uniques."
    `;
  const field = (err.message as string).matchAll(/(\w+): \"(.+?)\"/g);

  const errorField = Object.fromEntries(
    Array.from(field, (match) => [match[1], `${match[2]} est déjà utilisé`])
  );

  return new AppError(req, {
    statusCode: 400,
    message,
    fields: errorField,
  });
};

export const handleJsonWebTokenError = (req: Request): AppError => {
  const message = errorMessage.ERROR_LOGIN_REQUIRED;

  return new AppError(req, { statusCode: 401, message });
};

export const handleTokenExpiredError = (req: Request): AppError => {
  const message =
    "Votre session a expiré, veuillez vous reconnecter à votre compte";

  return new AppError(req, { statusCode: 401, message });
};

export const handleErrorDev = (
  err: AppErrorInterface,
  req: Request,
  res: Response
) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      isOperational: err.isOperational,
      categories: err.categories,
      createdAt: err.createdAt,
      status: err.status,
      statusCode: err.statusCode,
      _id: err._id,
      priority: err.priority,
      fields: err.fields,
      context: err.context,
      stack: err.stack,
      name: err.name,
      message: err.message,
    });
  } else {
    const message =
      "Une erreur s'est produite. Veuillez réessayer plus tard. Si le problème persiste, veuillez contacter notre équipe de support technique pour obtenir de l'aide.";

    const error = new AppError(req, { statusCode: 500, message: message });

    return res.status(500).json({
      isOperational: error.isOperational,
      categories: error.categories,
      createdAt: error.createdAt,
      status: error.status,
      statusCode: error.statusCode,
      _id: error._id,
      priority: error.priority,
      fields: error.fields,
      context: error.context,
      stack: error.stack,
      name: error.name,
      message: error.message,
    });
  }
};

export const handleErrorProd = (
  err: AppErrorInterface,
  req: Request,
  res: Response
) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      isOperational: err.isOperational,
      categories: err.categories,
      createdAt: err.createdAt,
      status: err.status,
      statusCode: err.statusCode,
      _id: err._id,
      priority: err.priority,
      fields: err.fields,
      name: err.name,
      message: err.message,
      context: err.context,
    });
  } else {
    const message =
      "Une erreur s'est produite. Veuillez réessayer plus tard. Si le problème persiste, veuillez contacter notre équipe de support technique pour obtenir de l'aide.";

    const error = new AppError(req, { statusCode: 500, message: message });

    return res.status(500).json({
      isOperational: error.isOperational,
      categories: error.categories,
      createdAt: error.createdAt,
      status: error.status,
      statusCode: error.statusCode,
      _id: error._id,
      priority: error.priority,
      fields: error.fields,
      name: error.name,
      message: error.message,
    });
  }
};
