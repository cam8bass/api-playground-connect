import { SendEmailOptionsInterface, userRequestInterface } from "../interfaces";
import nodemailer, { TransportOptions, Transporter } from "nodemailer";
import { MailOptions } from "nodemailer/lib/stream-transport";
import client from "../../infisical";

export default class EmailManager {
  private transporter: Transporter;
  private emailUsername: string;
  private emailPassword: string;

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

  private async sendEmail(options: SendEmailOptionsInterface) {
    if (!this.transporter) {
      await this.setupTransporter();
    }

    const mailOptions: MailOptions = {
      from: '"cam" <cam@email.com>',
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
