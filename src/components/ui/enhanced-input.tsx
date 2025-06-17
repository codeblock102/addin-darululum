import React from "react";
import { Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  isSearch?: boolean;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  icon,
  error,
  isSearch = false,
  className,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        {(icon || isSearch) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearch ? <Search className="h-5 w-5 text-gray-400" /> : icon}
          </div>
        )}

        <input
          className={cn(
            isSearch ? "search-input-enhanced" : "input-enhanced",
            (icon || isSearch) && "pl-10",
            error &&
              "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className,
          )}
          {...props}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export const EnhancedFilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  value,
  onChange,
}) => {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      <div className="relative">
        <Filter className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-5 w-5 text-gray-400" />

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "input-enhanced pl-10 pr-8 appearance-none cursor-pointer",
            "bg-white dark:bg-gray-800",
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
