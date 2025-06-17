import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export const useActiveTab = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    // Check if we're on the attendance page (separate route)
    if (location.pathname === "/attendance") {
      setActiveTab("attendance");
      return;
    }

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
  }, [location.search, location.pathname]);

  return { activeTab, setActiveTab };
};
