export class CreateMessageDto {
  content: string;
  conversationContext?: string[];
  conversationId?: string;
  saveConversation?: boolean;
}
