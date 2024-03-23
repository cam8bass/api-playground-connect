import crypto from "crypto";
/**
 * Creates a random token
 * @returns {{resetToken: string, resetHashToken: string, dateExpire: Date}}
 */
export const createResetRandomToken = (): {
  resetToken: string;
  resetHashToken: string;
  dateExpire: Date;
} => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetHashToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const dateExpire = new Date(Date.now() + 10 * 60 * 1000);
  return { resetToken, resetHashToken, dateExpire };
};

/**
 * Creates a hash from a given reset token
 * @param {string} resetToken - the reset token to hash
 * @returns {string} the hashed reset token
 */
export const createHashRandomToken = (resetToken: string): string => {
  return crypto.createHash("sha256").update(resetToken).digest("hex");
};
