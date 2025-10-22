import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group";
import React from "react";

import { useVoiceChat } from "../avatar-stream-hooks/useVoiceChat";
import { useInterrupt } from "../avatar-stream-hooks/useInterrupt";

import { AudioInput } from "./AudioInput";
import { TextInput } from "./TextInput";
import { Button } from "../ui/Button";

export const AvatarControls: React.FC = () => {
    const { isVoiceChatLoading, isVoiceChatActive, startVoiceChat, stopVoiceChat } = useVoiceChat();
    const { interrupt } = useInterrupt();

    const toggleItem = "data-[state=on]:bg-zinc-800 rounded-lg p-2 text-sm w-[90px] text-center"

    return (
        <div className="flex flex-col gap-3 relative w-full items-center">
            <ToggleGroup
                className={`bg-zinc-700 rounded-lg p-1 ${isVoiceChatLoading ? "opacity-50" : ""}`}
                disabled={isVoiceChatLoading}
                type="single"
                value={isVoiceChatActive || isVoiceChatLoading ? "voice" : "text"}
                onValueChange={(value) => {
                    const toggledToTextChat = value === "text" && isVoiceChatActive && !isVoiceChatLoading
                    const toggledToVoiceChat = value === "voice" && !isVoiceChatActive && !isVoiceChatLoading

                    if (value === "text") { startVoiceChat() }
                    if (value === "voice") { stopVoiceChat() }
                }}
            >
                <ToggleGroupItem value="voice" className={toggleItem}> {`Voice Chat`} </ToggleGroupItem>
                <ToggleGroupItem value="text" className={toggleItem}> {`Text Chat`} </ToggleGroupItem>

            </ToggleGroup>
            {isVoiceChatActive || isVoiceChatLoading ? <AudioInput /> : <TextInput />}
            <div className="absolute top-[-70px] right-3">
                <Button className="!bg-zinc-700 !text-white" onClick={interrupt}>
                    Interrupt
                </Button>
            </div>
        </div>
    );
};
