
import { useEffect, useState } from "react";

interface CircularProgressIndicatorProps {
  value: number;
  size: number;
  strokeWidth?: number;
}

export const CircularProgressIndicator = ({
  value,
  size,
  strokeWidth = 5,
}: CircularProgressIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  
  // Animate the progress value
  useEffect(() => {
    const timeout = setTimeout(() => {
      setProgress(value);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [value]);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Determine color based on progress value
  const getProgressColor = () => {
    if (progress >= 70) return "#10B981"; // green-500
    if (progress >= 40) return "#F59E0B"; // amber-500
    return "#EF4444"; // red-500
  };
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-gray-200 dark:stroke-gray-800"
        />
        
        {/* Foreground circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none"
          stroke={getProgressColor()}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>
      
      {/* Percentage text */}
      <div
        className="absolute inset-0 flex items-center justify-center text-xs font-medium"
        style={{ color: getProgressColor() }}
      >
        {progress}%
      </div>
    </div>
  );
};
