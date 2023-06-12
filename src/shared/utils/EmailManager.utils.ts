import { SendEmailOptionsInterface } from "../interfaces";
import nodemailer, { TransportOptions, Transporter } from "nodemailer";
import { MailOptions } from "nodemailer/lib/stream-transport";

export default class EmailManager {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport<Transporter>({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    } as TransportOptions);
  }

  private async sendEmail(options: SendEmailOptionsInterface) {
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

    Nous vous contactons concernant: ${subject}.\n

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
      emailManager
        .sendEmail(options)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }
}
