import { useStreamingAvatarContext } from "./context";

export const useMessageHistory = () => {
  const { messages } = useStreamingAvatarContext();

  return { messages };
};
