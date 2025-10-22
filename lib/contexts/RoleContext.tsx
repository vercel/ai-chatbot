"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Role = "admin" | "user";

type RoleContextType = {
  role: Role;
  isAdmin: boolean;
  toggleRole: () => void;
  setRole: (role: Role) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("user");

  const toggleRole = () => {
    setRole((prev) => (prev === "admin" ? "user" : "admin"));
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        isAdmin: role === "admin",
        toggleRole,
        setRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
