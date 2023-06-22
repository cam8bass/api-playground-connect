import { v4 as uuidv4 } from "uuid";
import cryptoJs from "crypto-js";
import client from "../../infisical";

class ApiKeyManager {
  private static privateKey: string | null = null;

  private static async getPrivateKey(): Promise<string> {
    if (!ApiKeyManager.privateKey) {
      const { secretValue } = await client.getSecret("PRIVATE_API_KEY");
      ApiKeyManager.privateKey = secretValue;
    }
    return ApiKeyManager.privateKey;
  }

  static createNewApiKey(): string {
    const newApiKey = uuidv4();
    return newApiKey;
  }

  static async encryptApiKey(apiKey: string): Promise<string> {
    const privateKey = await ApiKeyManager.getPrivateKey();
    const apiKeyEncrypt = cryptoJs.AES.encrypt(apiKey, privateKey).toString();
    return apiKeyEncrypt;
  }

  static async decryptApiKey(encryptedApiKey: string): Promise<string> {
    const privateKey = await ApiKeyManager.getPrivateKey();
    const bytes = cryptoJs.AES.decrypt(encryptedApiKey, privateKey);
    const apiKeyDecrypt = bytes.toString(cryptoJs.enc.Utf8);
    return apiKeyDecrypt;
  }
}

export default ApiKeyManager;




