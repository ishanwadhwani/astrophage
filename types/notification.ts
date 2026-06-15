export type NotificationType =
  | "INVOICE_OVERDUE"
  | "INVOICE_DUE_SOON"
  | "BILL_OVERDUE"
  | "BILL_DUE_SOON"
  | "PAYMENT_RECEIVED"
  | "RECURRING_GENERATED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
  read: boolean;
  computed: boolean;
}

export interface NotificationResponse {
  notifications: AppNotification[];
  unreadCount: number;
}
