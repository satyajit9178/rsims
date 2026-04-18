import { createContext, useContext, useState } from 'react';

const DemoContext = createContext({ isDemo: false });

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo] = useState(false);
  return (
    <DemoContext.Provider value={{ isDemo, setIsDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}