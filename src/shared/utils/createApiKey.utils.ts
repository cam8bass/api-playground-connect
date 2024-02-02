import { v4 as uuidv4 } from "uuid";
import cryptoJs from "crypto-js";
import client from "../../infisical";

export class ApiKeyManager {
  private static privateKey: string | null = null;

  /**
   * Retrieves the private key from AWS Secrets Manager.
   * @returns {Promise<string>} The private key.
   */
  private static async getPrivateKey(): Promise<string> {
    if (!ApiKeyManager.privateKey) {
      const { secretValue } = await client.getSecret("PRIVATE_API_KEY");
      ApiKeyManager.privateKey = secretValue;
    }
    return ApiKeyManager.privateKey;
  }

  /**
   * generates a new api key
   * @returns {string} the new api key
   */
  static createNewApiKey(): string {
    const newApiKey = uuidv4();
    return newApiKey;
  }

  /**
   * Encrypts an API key using the private key stored in AWS Secrets Manager.
   * @param {string} apiKey - The API key to be encrypted.
   * @returns {Promise<string>} The encrypted API key.
   */
  static async encryptApiKey(apiKey: string): Promise<string> {
    const privateKey = await ApiKeyManager.getPrivateKey();
    const apiKeyEncrypt = cryptoJs.AES.encrypt(apiKey, privateKey).toString();
    return apiKeyEncrypt;
  }

  /**
   * Decrypts an API key using the private key stored in AWS Secrets Manager.
   * @param {string} encryptedApiKey - The encrypted API key to be decrypted.
   * @returns {Promise<string>} The decrypted API key.
   */
  static async decryptApiKey(encryptedApiKey: string): Promise<string> {
    const privateKey = await ApiKeyManager.getPrivateKey();
    const bytes = cryptoJs.AES.decrypt(encryptedApiKey, privateKey);
    const apiKeyDecrypt = bytes.toString(cryptoJs.enc.Utf8);
    return apiKeyDecrypt;
  }
}


