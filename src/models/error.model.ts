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

export const handleErrorDev = (err: AppErrorInterface, res: Response) => {
  res.status(err.statusCode).json({
    statusCode: err.statusCode,
    message: err.message,
    fields: err.fields,
    errors: err,
    stack: err.stack,
  });
};

export const handleErrorProd = (err: AppErrorInterface, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      status:err.status,
      message: err.message,
      fields: err.fields,
    });
  } else {
    const message =
      "Une erreur s'est produite. Veuillez réessayer plus tard. Si le problème persiste, veuillez contacter notre équipe de support technique pour obtenir de l'aide.";

    res.status(500).json({
      statusCode: 500,
      status: "error",
      message,
    });
  }
};

// FIXME: OLD VERSION
// export const handleCastError = (err: any): AppError => {
//   const url = `Désolé, une erreur est survenue. L'url attend une donnée de type ${err.path}. Veuillez vérifier: ${err.value} ou essayer une autre requête`;
//   const message = `La requête a échoué en raison d'un format d'URL incorrect. L'url attend une donnée de type ${err.path}. Veuillez vérifier: ${err.value}`;

//   return new AppError(404, message, { request: url });

// };

// export const handleValidationError = (err: any): AppError => {
//   const value = Object.values(err.errors).map((el: any) => el.message);

//   const message = `La requête a échoué en raison de données de formulaire incorrectes ou invalides. Veuillez vérifier les champs suivant du formulaire : ${value.join(
//     ", "
//   )} et réessayer.`;

//   const field = Object.keys(err.errors).reduce((acc, key) => {
//     acc[key] = err.errors[key].message;
//     return acc;
//   }, {});

//   return new AppError(400, message, field);
// };

// export const handleDuplicateError = (err: any): AppError => {
//   const value = (err.message as string)
//     .match(/{[^}]+}/)
//     .at(0)
//     .replace(/[\\"{}]/g, "");

//   const message = `"La requête a échoué en raison d'une duplication de données pour les champs : ${value.trim()}. L'élément que vous tentez de créer ou de modifier existe déjà dans notre système. Veuillez vérifier les détails que vous avez fournis et assurez-vous qu'ils sont uniques."
//     `;
//   const field = (err.message as string).matchAll(/(\w+): \"(.+?)\"/g);

//   const errorField = Object.fromEntries(
//     Array.from(field, (match) => [match[1], `${match[2]} est déjà utilisé`])
//   );

//   return new AppError(400, message, errorField);
// };

// export const handleJsonWebTokenError = (): AppError => {
//   const message =
//     "Le token semble avoir été modifié ou altéré. Vérifiez l'intégrité du token généré et assurez-vous qu'aucune altération n'a eu lieu pendant le processus de transmission ou de stockage.";
//   return new AppError(401, message, {
//     request: errorMessage.ERROR_LOGIN_REQUIRED,
//   });
// };

// export const handleTokenExpiredError = (): AppError => {
//   const message =
//     "Le token est expiré. Cela signifie que la période de validité du token a expiré et qu'il ne peut plus être utilisé pour authentifier les requêtes. Pour résoudre ce problème, générez un nouveau token en suivant le processus d'authentification approprié. Assurez-vous également de vérifier et de mettre à jour régulièrement les durées de validité des tokens pour éviter les expirations inattendues.";

//   return new AppError(401, message, {
//     request: errorMessage.ERROR_SESSION_EXPIRED,
//   });
// };

// export const handleErrorDev = (error: AppErrorInterface, res: Response) => {
//   res.status(error.statusCode).json({
//     message: error.message,
//     error: error,
//     stack: error.stack,
//   });
// };

// export const handleErrorProd = (error: AppErrorInterface, res: Response) => {
//   if (error.isOperational) {
//     res.status(error.statusCode).json({
//       statusCode: error.statusCode,
//       status: error.status,
//       message: error.message,
//       errors: error.errors,
//     });
//   } else {
//     res.status(500).json({
//       statusCode: error.statusCode,
//       status: "error",
//       message:
//         "Une erreur interne du serveur est survenue lors du traitement de votre requête. Cela peut être dû à divers facteurs, y compris des erreurs dans la logique métier, des problèmes de base de données ou des dysfonctionnements temporaires du serveur. Les développeurs ont été notifiés de cette erreur et travaillent activement à sa résolution. Nous vous prions de nous excuser pour ce désagrément et vous encourageons à réessayer plus tard. Si le problème persiste, veuillez contacter notre équipe de support technique pour obtenir de l'aide.",
//       errors: {
//         resquest: "Une erreur s'est produite. Veuillez réessayer plus tard.",
//       },
//     });
//   }
// };
