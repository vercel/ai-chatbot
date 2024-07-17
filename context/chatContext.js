import { createContext, useContext, useReducer } from 'react';
// import { useLocalStorage } from '@/lib/hooks/use-local-storage';

const ChatContext = createContext(null);

const ChatDispatchContext = createContext(null);

export function ChatProvider({ children }) {
  // const [model] = useLocalStorage('model', {});
  const [chats, dispatch] = useReducer(
    chatsReducer,
    initialChat
  );

  return (
    <ChatContext.Provider value={chats}>
      <ChatDispatchContext.Provider value={dispatch}>
        {children}
      </ChatDispatchContext.Provider>
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}

export function useChatDispatch() {
  return useContext(ChatDispatchContext);
}

function chatsReducer(chats, action) {
  switch (action.type) {
    case 'update': {
      return {
        ...action.payload,
      };
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

const initialChat = {
    "Status":"enabled",
    "Vector":"pinecone",
    "System prompt":"You are a jurisprudency analist and you can help users understand legal terms, step by step.\n    You and the user can discuss legal terms and the user can ask you to explain the terms.\n    Use only information from the provided context. Always list the used references and sources from the context including the fiuelds Processo, Relator, Ementa, Acórdão and Link.\n    Based on the context you obtain, craft a well-thought-out response and indicate your sources. NEVER invented numbers or hallucinated. Only use information from the file provided. \n    If you can't find the answer, say: 'I still don't know the answer, unfortunately.' Use the data format provided to prepare your answer and include at least the following keys in your answer: \n    \"process\", \"rapporteur\", \"menu\" and \"agreement\" and \"link\". Remember that the 'link' of the process is exactly the one that appears in the file, considering a string from the \"link\" key, \n    which always starts with the following structure: \"https://processo.stj.jus.br/processo /search/?num_registro=...\".\n    Answer always in Brazilian Portuguese.",
    "Model":"gpt-4o",
    "Name":"juris_stj"
  }