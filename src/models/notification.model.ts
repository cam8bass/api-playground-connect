import { Query, Schema, model } from "mongoose";
import {
  CustomQuery,
  NotificationInterface,
  NotificationModelInterface,
} from "../shared/interfaces";
import { validationMessage } from "../shared/messages";
import validator from "validator";
import { notificationType } from "../shared/types/types";
import { Types } from "mongoose";
import User from "./user.model";

const notificationSchema = new Schema<
  NotificationInterface,
  NotificationModelInterface
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        validationMessage.VALIDATE_REQUIRED_FIELD("utilisateur"),
      ],
      unique: true,
    },
    notifications: [
      {
        message: {
          type: String,
          required: [
            true,
            validationMessage.VALIDATE_REQUIRED_FIELD("message"),
          ],
          trim: true,
          lowercase: true,
          minlength: [5, validationMessage.VALIDATE_MIN_LENGTH("message", 5)],
          maxlength: [
            100,
            validationMessage.VALIDATE_MAX_LENGTH("message", 100),
          ],
          validate: [
            validator.isAlpha,
            validationMessage.VALIDATE_ONLY_STRING("message"),
          ],
        },
        createAt: {
          type: Date,
          default: Date.now(),
          validate: [
            validator.isISO8601,
            validationMessage.VALIDATE_FIELD("une date"),
          ],
        },
        read: {
          type: Boolean,
          default: false,
          validate: [
            validator.isBoolean,
            validationMessage.VALIDATE_FIELD("une valeur booléenne"),
          ],
        },

        readAt: {
          type: Date,
          validator: [
            validator.isISO8601,
            validationMessage.VALIDATE_FIELD("une date"),
          ],
        },
        type: {
          type: String,
          enum: ["success", "fail", "error"],
          message: validationMessage.VALIDATE_FIELD("un type de notification"),
          required: [true, validationMessage.VALIDATE_REQUIRED_FIELD("type")],
        },
      },
    ],
  },
  {
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.index({ user: 1 });

notificationSchema.pre<
  Query<NotificationInterface[], NotificationInterface> & CustomQuery
>(/^find/, function (next) {
  this.select("-__v");
  next();
});

/**
 * Creates a new notification for a user.
 * @param {ObjectId} idUser - The id of the user to create the notification for.
 * @param {notificationType} type - The type of notification to create.
 * @param {string} message - The message of the notification.
 */

notificationSchema.statics.createNotification = async function (
  idUser: Types.ObjectId,
  type: notificationType,
  message: string
): Promise<NotificationInterface | null> {
  // TODO: A voir pour améliorer
  if (!message || !type || !idUser) return null;

  const notification = await this.findOneAndUpdate(
    { user: idUser },
    {
      $push: {
        notifications: {
          message,
          type,
        },
      },
    },
    { upsert: true, new: true }
  );

  return notification;
};

// TODO: A VOIR
notificationSchema.statics.searchAndSendAdminNotification = async function (
  type: notificationType,
  message: string
) {
  const admin = await User.find({ role: "admin" }).select("_id").lean();

  if (!admin) return;

  admin.map(async (admin) => {
    await this.createNotification(admin._id, type, message);
  });
};

const Notification = model<NotificationInterface, NotificationModelInterface>(
  "Notification",
  notificationSchema
);

export default Notification;
