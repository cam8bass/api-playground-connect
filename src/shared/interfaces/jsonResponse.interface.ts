import { NotificationDetailInterface } from "./notification.interface";


export interface jsonResponseInterface {
  status: string;
  notification?: NotificationDetailInterface;
  data?: any;
  results?: number;
  limit?: number;
}

export interface jsonResponseOptionsInterface {
  notification?: NotificationDetailInterface;
  data?: any;
  results?: number;
  limit?: number;
}
