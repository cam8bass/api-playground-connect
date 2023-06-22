import { ApiKeyInterface, UserInterface } from "../interfaces";


const bodyFilter = <T extends UserInterface | ApiKeyInterface>(
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

export default bodyFilter;
