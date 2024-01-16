import { Query } from "mongoose";
import { UserInterface } from "./user.interface";
import { ApiKeyInterface } from "./apiKey.interface";
import { NotificationInterface } from "./notification.interface";

export interface CustomQuery {
  select(
    fields: string
  ): Query<
    UserInterface[] | ApiKeyInterface[] | NotificationInterface,
    UserInterface | ApiKeyInterface | NotificationInterface
  >;
}
