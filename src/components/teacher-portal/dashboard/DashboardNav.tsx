import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export const useActiveTab = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    if (
      tabParam &&
      [
        "students",
        "progress-book",
        "attendance",
        "schedule",
        "performance",
        "messages",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("overview");
    }
  }, [location.search]);

  return { activeTab, setActiveTab };
};
