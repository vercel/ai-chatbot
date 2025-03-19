import { ChatConfig } from "./lib/chat-config";

const config: ChatConfig = {
  guestUsage: {
    isEnabled: true,
    userId: process.env.GUEST_USER_ID!,
  },
};

export default config;
