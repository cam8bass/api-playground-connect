import { notificationInterface } from "./notification.interface";

export interface jsonResponseInterface {
  status: string;
  token?: string;
  notification?: notificationInterface;
  data?: any;
  results?: number;
}

export interface jsonResponseOptionsInterface {
  token?: string;
  notification?: notificationInterface;
  data?: any;
  results?: number;
}
