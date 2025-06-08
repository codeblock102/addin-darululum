import { useState } from "react";

export const useActiveTab = (initialTab: string) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  return { activeTab, setActiveTab };
};
