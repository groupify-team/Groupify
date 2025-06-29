// FilterDropdown.jsx - Filter dropdown component
import React from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { FILTER_OPTIONS } from "@dashboard/utils/dashboardConstants.jsx";

const FilterDropdown = ({
  isOpen,
  onToggle,
  onClose,
  currentFilter,
  onFilterChange,
  filterLabel,
}) => {
  return (
    <div className="relative w-full sm:min-w-[140px] sm:w-auto filter-dropdown">
      {/* Dropdown Button */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 sm:py-3 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white cursor-pointer text-sm font-medium shadow-sm hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all duration-200 flex items-center justify-between"
      >
        <span>{filterLabel}</span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Mobile dropdown - pushes content down */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-1000 ease-in-out ${
          isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onFilterChange(option.value);
                onClose();
              }}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-150 ${
                currentFilter === option.value
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop dropdown - overlays */}
      {isOpen && (
        <div className="hidden sm:block absolute top-full left-0 right-0 mt-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50 overflow-hidden">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onFilterChange(option.value);
                onClose();
              }}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-150 ${
                currentFilter === option.value
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
