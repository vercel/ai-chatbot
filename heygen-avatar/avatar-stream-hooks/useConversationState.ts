import { useCallback } from "react";

import { useStreamingAvatarContext } from "./context";

export const useConversationState = () => {
  const { avatarRef, isAvatarTalking, isUserTalking, isListening } =
    useStreamingAvatarContext();

  const startListening = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current.startListening();
  }, [avatarRef]);

  const stopListening = useCallback(() => {
    if (!avatarRef.current) return;
    avatarRef.current.stopListening();
  }, [avatarRef]);

  return {
    isAvatarListening: isListening,
    startListening,
    stopListening,
    isUserTalking,
    isAvatarTalking,
  };
};
