"use client";

import { createContext, useContext, type ReactNode } from "react";

const ModuleChromeContext = createContext<ReactNode>(null);

export function ModuleChromeProvider({
  children,
  chrome,
}: {
  children: ReactNode;
  chrome: ReactNode;
}) {
  return (
    <ModuleChromeContext.Provider value={chrome}>
      {children}
    </ModuleChromeContext.Provider>
  );
}

export function useModuleChrome() {
  return useContext(ModuleChromeContext);
}
