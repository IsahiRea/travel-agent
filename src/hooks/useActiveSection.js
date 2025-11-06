import { useState, useEffect } from 'react';

/**
 * Custom hook to track which section is currently in view
 * Uses Intersection Observer API for efficient scroll detection
 */
export function useActiveSection() {
  const [activeSection, setActiveSection] = useState('flights');

  useEffect(() => {
    // All section IDs we want to track (in order they appear on page)
    const sectionIds = ['overview', 'flights', 'hotels', 'budget', 'itinerary', 'tips'];

    // Function to determine active section based on scroll position
    const updateActiveSection = () => {
      // Find which section is currently most visible in viewport
      let bestSection = '';
      let bestScore = -1;

      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;

        const rect = element.getBoundingClientRect();

        // Skip sections with no height (like hidden overview on desktop)
        if (rect.height === 0) return;

        // Calculate how much of the section is visible and how close to top
        const viewportHeight = window.innerHeight;
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        // Score based on visibility and position (prefer sections near top)
        const visibilityRatio = visibleHeight / rect.height;
        const topProximity = 1 - (Math.abs(rect.top) / viewportHeight);
        const score = visibilityRatio * 0.7 + topProximity * 0.3;

        // Bonus for sections at the very top of viewport
        const bonus = rect.top >= 0 && rect.top < 100 ? 0.5 : 0;
        const finalScore = score + bonus;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestSection = id;
        }
      });

      if (bestSection && bestSection !== activeSection) {
        setActiveSection(bestSection);
      }
    };

    // Initial check
    updateActiveSection();

    // Use scroll event as primary detection method
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Also use Intersection Observer as backup
    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger update when any section visibility changes
        if (entries.some(entry => entry.isIntersecting)) {
          updateActiveSection();
        }
      },
      {
        rootMargin: '-10% 0px -40% 0px',
        threshold: [0, 0.5, 1.0]
      }
    );

    // Observe sections after a short delay to ensure they're rendered
    const timeoutId = setTimeout(() => {
      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [activeSection]);

  return activeSection;
}
