/**
 * Application Routes
 * Centralized route path constants to avoid hardcoded strings
 */

export const ROUTES = {
  HOME: '/',
  PLANNING: '/planning',
  RESULTS: '/results'
};

/**
 * Navigation links configuration for header and other navigation components
 */
export const NAV_LINKS = [
  {
    path: ROUTES.HOME,
    label: 'Home'
  },
  {
    path: ROUTES.PLANNING,
    label: 'Plan Trip'
  }
];
