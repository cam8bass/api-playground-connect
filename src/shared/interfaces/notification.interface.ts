import { Types, Document, Model } from "mongoose";
import { notificationType } from "../types/types";

export interface NotificationInterface extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  notifications: NotificationDetailInterface[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationModelInterface
  extends Model<NotificationInterface> {
  createNotification(
    idUser: Types.ObjectId,
    type: notificationType,
    message: string
  ): Promise<NotificationDetailInterface>;
  searchAndSendAdminNotification(
    type: notificationType,
    message: string
  ): Promise<void>;
}

export interface NotificationDetailInterface {
  type: notificationType;
  message: string;
  read: boolean;
  createdAt: Date;
  readAt: Date;
  _id: Types.ObjectId;
  view: boolean;
}
