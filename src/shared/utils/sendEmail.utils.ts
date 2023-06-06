import nodemailer, { TransportOptions, Transporter } from "nodemailer";
import { SendEmailOptionsInterface } from "../interfaces";
import { MailOptions } from "nodemailer/lib/stream-transport";

const SendEmail = async (options: SendEmailOptionsInterface) => {
  const transporter = nodemailer.createTransport<Transporter>({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  } as TransportOptions);

  const mailOptions: MailOptions = {
    from: '"cam" <cam@email.com>',
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

export default SendEmail;
