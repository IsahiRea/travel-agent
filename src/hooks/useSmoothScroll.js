import { useEffect } from 'react';

/**
 * Custom hook to enable smooth scrolling for anchor links
 * Automatically applies to all links with href starting with #
 */
export function useSmoothScroll() {
  useEffect(() => {
    const handleClick = (e) => {
      // Check if clicked element is an anchor link
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      // Find target element
      const target = document.querySelector(href);
      if (!target) return;

      // Prevent default jump
      e.preventDefault();

      // Smooth scroll to target
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Update URL without causing page jump
      if (window.history.pushState) {
        window.history.pushState(null, null, href);
      }
    };

    // Add event listener
    document.addEventListener('click', handleClick);

    // Cleanup
    return () => document.removeEventListener('click', handleClick);
  }, []);
}
