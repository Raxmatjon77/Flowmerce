export interface NotificationResponseDto {
  id: string;
  recipientId: string;
  channel: string;
  type: string;
  status: string;
  subject: string;
  createdAt: Date;
}
