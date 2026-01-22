export const getInitials = (name: string | undefined): string => {
  if (!name) return "U";
  const parts = name.split("@")[0].split(".");
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

