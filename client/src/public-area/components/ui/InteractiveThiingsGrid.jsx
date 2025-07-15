import React, { useState, useEffect } from 'react';

// Real Thiings Icon Component
const ThiingsIcon = ({ iconPath, description, isActive, delay = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative aspect-square w-full h-full">
      {/* Thiings Icon Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={iconPath}
          alt={description}
          className={`
            w-full h-full object-contain
            transition-opacity duration-300
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `
              <div class="w-full h-full flex items-center justify-center text-6xl opacity-50">
                🎯
              </div>
            `;
          }}
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

// Main Interactive Grid Component
const InteractiveThiingsGrid = ({ isLoaded }) => {
  const [activeIcon, setActiveIcon] = useState(0);
  const [isGridHovered, setIsGridHovered] = useState(false);
  const [hoveredBenefit, setHoveredBenefit] = useState(null);

  // Icon configurations with actual Thiings icon paths - ordered for scroll progression
  const gridIcons = [
    {
      path: '/thiings-icons/camera.png',
      description: 'Smart Photo Capture'
    },
    {
      path: '/thiings-icons/people.png', 
      description: 'Group Recognition'
    },
    {
      path: '/thiings-icons/heart.png',
      description: 'Share Memories'
    },
    {
      path: '/thiings-icons/calendar.png',
      description: 'Event Planning'
    },
    {
      path: '/thiings-icons/phone.png',
      description: 'Multi-Device Access'
    },
    {
      path: '/thiings-icons/lock.png',
      description: 'Privacy & Security'
    }
  ];

  // Handle scroll-based icon changes
  useEffect(() => {
    if (!isGridHovered && hoveredBenefit === null) {
      const handleScroll = () => {
        // Get the benefits section container
        const benefitsContainer = document.querySelector('.space-y-4');
        if (!benefitsContainer) return;
        
        const containerRect = benefitsContainer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Only start changing icons when container is well into view
        if (containerRect.top > windowHeight * 0.3) {
          setActiveIcon(0); // Stay on first icon
          return;
        }
        
        // Calculate progress through the container (slower start)
        const startThreshold = windowHeight * 0.3;
        const progress = Math.max(0, (startThreshold - containerRect.top) / (containerRect.height + startThreshold));
        
        // Map to icon index with slower progression
        const iconIndex = Math.min(Math.floor(progress * gridIcons.length * 2), gridIcons.length - 1);
        setActiveIcon(iconIndex);
      };

      // Throttle scroll events
      let ticking = false;
      const throttledScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', throttledScroll);
      handleScroll();
      return () => window.removeEventListener('scroll', throttledScroll);
    }
  }, [isGridHovered, hoveredBenefit, gridIcons.length]);

  // Handle benefit hover from parent component
  useEffect(() => {
    const handleBenefitHover = (event) => {
      const benefitIndex = parseInt(event.detail.index);
      if (benefitIndex >= 0 && benefitIndex < gridIcons.length) {
        setHoveredBenefit(benefitIndex);
        setActiveIcon(benefitIndex);
      }
    };

    const handleBenefitLeave = () => {
      setHoveredBenefit(null);
    };

    window.addEventListener('benefitHover', handleBenefitHover);
    window.addEventListener('benefitLeave', handleBenefitLeave);

    return () => {
      window.removeEventListener('benefitHover', handleBenefitHover);
      window.removeEventListener('benefitLeave', handleBenefitLeave);
    };
  }, [gridIcons.length]);

  return (
    <div 
      className="aspect-square bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20 dark:border-gray-700/50 relative overflow-hidden"
      onMouseEnter={() => setIsGridHovered(true)}
      onMouseLeave={() => setIsGridHovered(false)}
    >
      {/* Single Large Icon Display with Smooth Transition */}
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="relative w-full h-full">
          {/* Crossfade transition between icons */}
          {gridIcons.map((icon, index) => (
            <div
              key={`icon-${index}`}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                index === activeIcon ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                pointerEvents: index === activeIcon ? 'auto' : 'none'
              }}
            >
              <ThiingsIcon
                iconPath={icon.path}
                description={icon.description}
                isActive={index === activeIcon}
                delay={0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveThiingsGrid;