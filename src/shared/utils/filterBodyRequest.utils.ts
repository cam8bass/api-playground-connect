import { ApiKeyInterface, UserInterface } from "../interfaces";

/**
 * Filters out unwanted properties from an object
 * @param {Partial<T>} requestBody - The object to filter
 * @param {...(keyof T)[]} fields - The properties to keep
 * @returns {Partial<T>} The filtered object
 */
export const bodyFilter = <T extends UserInterface | ApiKeyInterface>(
  requestBody: Partial<T>,
  ...fields: (keyof T)[]
): Partial<T> => {
  const filteredBody: Partial<T> = {};

  Object.keys(requestBody).forEach((el) => {
    const key = el as keyof T;
    if (fields.includes(key)) {
      filteredBody[key] = requestBody[key];
    }
  });

  return filteredBody;
};


