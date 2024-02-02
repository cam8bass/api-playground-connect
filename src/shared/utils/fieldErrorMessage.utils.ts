/**
 * Returns an object containing error messages for each required field in the given form body.
 * @param {object} body - The form body data.
 * @param {object} requiredFields - An object containing the names of the required fields as keys and the error messages as values.
 * @returns {object} - An object containing error messages for each required field that is missing or empty.
 */
export const fieldErrorMessages = (
  body: { [key: string]: any },
  requiredFields: { [key: string]: string }
): Partial<{ [key: string]: string }> => {
  const errors: { [key: string]: string } = {};

  Object.entries(requiredFields).forEach(([fieldName, errorMessage]) => {
    if (
      body[fieldName] === undefined ||
      body[fieldName] === null ||
      body[fieldName] === ""
    ) {
      errors[fieldName] = errorMessage;
    }
  });

  return errors;
};
