import React from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

const AuthVisual = ({ 
  title,
  description,
  features = [],
  stats = [],
  gradient = "from-indigo-500 via-purple-600 to-blue-600",
  className = ""
}) => {
  return (
    <div className={`lg:flex-1 lg:flex-col lg:justify-center lg:items-center lg:px-8 xl:px-12 2xl:px-20 bg-gradient-to-br ${gradient} relative overflow-hidden ${className}`}>
      {/* Background Decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-white max-w-lg xl:max-w-xl 2xl:max-w-2xl text-left">
        <h2 className="text-3xl xl:text-4xl font-bold mb-4 xl:mb-6">
          {title}
        </h2>
        <p className="text-lg xl:text-xl text-indigo-100 mb-6 xl:mb-8 leading-relaxed">
          {description}
        </p>

        {/* Stats (if provided) */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold">{stat.number}</div>
                <div className="text-purple-200">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Feature List */}
        {features.length > 0 && (
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                  {feature.icon || <CheckIcon className="w-4 h-4" />}
                </div>
                <span>{feature.text || feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthVisual;