"use client";

import type { DataUIPart } from "ai";
import type { Dispatch, SetStateAction } from "react";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CustomUIDataTypes } from "@/lib/types";

type DataStreamContextValue = {
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: Dispatch<SetStateAction<DataUIPart<CustomUIDataTypes>[]>>;
};

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

type DataStreamProviderProps = {
  children: ReactNode;
};

export const DataStreamProvider = ({ children }: DataStreamProviderProps) => {
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    []
  );

  const value = useMemo(() => ({ dataStream, setDataStream }), [dataStream]);

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
};

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error("useDataStream must be used within a DataStreamProvider");
  }
  return context;
}
