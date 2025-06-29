import React from "react";
import { CheckIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const PasswordRequirements = ({ 
  password, 
  showRequirements, 
  onToggleRequirements, 
  className = "" 
}) => {
  const requirements = [
    {
      test: (pwd) => pwd.length >= 6,
      label: "At least 6 characters",
    },
    {
      test: (pwd) => /[A-Z]/.test(pwd),
      label: "One uppercase letter",
    },
    {
      test: (pwd) => /[a-z]/.test(pwd),
      label: "One lowercase letter",
    },
    {
      test: (pwd) => /\d/.test(pwd),
      label: "One number",
    },
    {
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      label: "One special character (!@#$%^&*)",
    },
  ];

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Password requirements:
        </p>
        <button
          type="button"
          onClick={onToggleRequirements}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"
        >
          <ChevronUpIcon
            className={`w-4 h-4 transition-transform duration-300 ${
              showRequirements ? "rotate-0" : "rotate-180"
            }`}
          />
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showRequirements
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-2">
          {requirements.map((requirement, index) => {
            const isValid = requirement.test(password);
            return (
              <div key={index} className="flex items-center">
                {isValid ? (
                  <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                )}
                <span
                  className={`text-sm ${
                    isValid
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {requirement.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PasswordRequirements;