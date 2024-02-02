import { SendEmailOptionsInterface } from "../interfaces";
import nodemailer, { TransportOptions, Transporter } from "nodemailer";
import { MailOptions } from "nodemailer/lib/stream-transport";
import client from "../../infisical";

export  class EmailManager {
  private transporter: Transporter;
  private emailUsername: string;
  private emailPassword: string;

  /**
   * Sets up the email transporter.
   *
   * This function retrieves the email username and password from AWS Secrets Manager and sets up the Nodemailer transporter.
   *
   * @async
   */
  private async setupTransporter() {
    if (!this.emailUsername) {
      const { secretValue } = await client.getSecret("EMAIL_USERNAME");
      this.emailUsername = secretValue;
    }

    if (!this.emailPassword) {
      const { secretValue } = await client.getSecret("EMAIL_PASSWORD");
      this.emailPassword = secretValue;
    }

    this.transporter = nodemailer.createTransport<Transporter>({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: this.emailUsername,
        pass: this.emailPassword,
      },
    } as TransportOptions);
  }

  /**
   * Sends an email using the configured transporter.
   *
   * @param {SendEmailOptionsInterface} options - The options for the email, including the recipients, subject, and body text.
  
   */
  private async sendEmail(options: SendEmailOptionsInterface) {
    if (!this.transporter) {
      await this.setupTransporter();
    }

    const mailOptions: MailOptions = {
      from: '"cam" <lc.laignel.dev@proton.me>',
      to: options.to,
      subject: options.subject,
      text: this.emailText(options.subject, options.text),
    };
    await this.transporter.sendMail(mailOptions);
  }

  private emailText = (subject: string, text: string) => {
    return `Bonjour,\n

    Nous vous contactons concernant le sujet suivant: ${subject}.\n

    Nous vous serions reconnaissants de bien vouloir prendre en compte les informations suivantes:\n

    ${text}\n

    Si vous avez des questions ou avez besoin d'assistance supplémentaire, n'hésitez pas à nous contacter à playgroundApi-support@email.com\n

    Nous vous exprimons toute notre gratitude pour votre attention et votre précieuse collaboration. Votre soutien est grandement apprécié.\n

    Cordialement,\n
    L'équipe technique de Playground API
    `;
  };

  /**
   * Sends an email using the configured transporter.
   *
   * @param {SendEmailOptionsInterface} options - The options for the email, including the recipients, subject, and body text.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the email was sent successfully.
   */
  public static async send(
    options: SendEmailOptionsInterface
  ): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const emailManager = new EmailManager();
      await emailManager.setupTransporter();
      emailManager
        .sendEmail(options)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }
}
