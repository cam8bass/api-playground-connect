import { notificationInterface } from "./notification.interface";

export interface jsonResponseInterface {
  status: string;
  notification?: notificationInterface;
  data?: any;
  results?: number;
}

export interface jsonResponseOptionsInterface {
  notification?: notificationInterface;
  data?: any;
  results?: number;
}
