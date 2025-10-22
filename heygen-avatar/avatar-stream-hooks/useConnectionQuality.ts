import { useStreamingAvatarContext } from "./context";

export const useConnectionQuality = () => {
  const { connectionQuality } = useStreamingAvatarContext();

  return {
    connectionQuality,
  };
};
