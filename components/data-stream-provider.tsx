"use client";

import type { DataUIPart } from "ai";
import type React from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CustomUIDataTypes } from "@/lib/types";

type DataStreamContextValue = {
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: React.Dispatch<
    React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
  >;
  clearDataStream: () => void;
};

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    []
  );
  
  // Ref to track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Clear data stream function to prevent memory leaks
  const clearDataStream = useMemo(() => () => {
    if (isMountedRef.current) {
      setDataStream([]);
    }
  }, []);

  // Auto-cleanup data stream when it gets too large (prevent memory leaks)
  useEffect(() => {
    if (dataStream.length > 1000) {
      console.warn("DataStream growing too large, clearing older entries");
      setDataStream(prev => prev.slice(-100)); // Keep only last 100 entries
    }
  }, [dataStream.length]);

  const value = useMemo(() => ({ 
    dataStream, 
    setDataStream: (newValue: React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>) => {
      if (isMountedRef.current) {
        setDataStream(newValue);
      }
    },
    clearDataStream 
  }), [dataStream, clearDataStream]);

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error("useDataStream must be used within a DataStreamProvider");
  }
  return context;
}
