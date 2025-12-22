  export const getBeltColor = (belt: any, defaultColor: string) => {
    if (!belt) return defaultColor;
    switch (belt.color?.toLowerCase()) {
      case "red":
        return "#ef4444";
      case "blue":
        return "#3b82f6";
      case "green":
        return "#10b981";
      case "yellow":
        return "#f59e0b";
      case "black":
        return "#000000";
      case "white":
        return "#ffffff";
      case "purple":
        return "#8b5cf6";
      default:
        return defaultColor;
    }
  };