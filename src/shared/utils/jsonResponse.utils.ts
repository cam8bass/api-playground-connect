import {
  jsonResponseOptionsInterface,
  jsonResponseInterface,
} from "../interfaces";

/**
 * @type {Object} notificationOptions
 * @property {string} type - Le type de la notification ("success", "fail").
 * @property {string} message - Le message de la notification destiné à l'utilisateur.
 */

/**
 * @type {Object} jsonResponseOptions
 * @property {notificationOptions} [notification] - Les détails de la notification à afficher à l'utilisateur en cas de succès.
 * @property {Object} [data] - Les données supplémentaires à inclure dans la réponse.
 */

/**
 * Génère une réponse JSON de succès en fonction des options fournies.
 *
 * @param {jsonResponseOptions} options - Les options pour construire la réponse JSON.
 * @returns {Object} L'objet JSON de la réponse de succès.
 */
export const jsonResponse = (
  options: jsonResponseOptionsInterface = {}
): jsonResponseInterface => {
  const jsonResponse: jsonResponseInterface = {
    status: "success",
  };

  if (options.notification) {
    jsonResponse.notification = options.notification;
  }

  if (options.data) {
    jsonResponse.data = options.data;
  }

  if (options.results !== undefined) {
    jsonResponse.results = options.results;
  }

  if (options.limit) {
    jsonResponse.limit = options.limit;
  }

  return jsonResponse;
};
