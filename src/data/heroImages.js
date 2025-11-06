import hero1 from '../assets/images/photos/hero-travel.jpg';
import hero2 from '../assets/images/photos/hero-eiffel.jpg';

export const LOCAL_HERO_IMAGES = [
  { url: hero1, alt: 'Tropical beach destination with palm trees' },
  { url: hero2, alt: 'Eiffel Tower in Paris, France' }
];

/**
 * Get a random hero image from local pool
 */
export function getRandomLocalHero() {
  return LOCAL_HERO_IMAGES[
    Math.floor(Math.random() * LOCAL_HERO_IMAGES.length)
  ];
}
