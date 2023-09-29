import { Query } from "mongoose";
import { UserInterface } from "./user.interface";
import { ApiKeyInterface } from "./apiKey.interface";

export interface CustomQuery {
  select(fields: string): Query<UserInterface[]|ApiKeyInterface[], UserInterface | ApiKeyInterface>;
}