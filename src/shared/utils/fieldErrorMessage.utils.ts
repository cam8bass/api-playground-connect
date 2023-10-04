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
