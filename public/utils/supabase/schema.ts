import { Message } from "ai";

export interface Chat {
  id: string;
  messages: Array<Message>;
}
