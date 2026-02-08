import { Repository } from './types';

export const MOCK_REPOS: Repository[] = [
  {
    id: 1,
    name: 'react-dating-app',
    full_name: 'developer/react-dating-app',
    description: 'A full-featured dating application clone built with React Native and Firebase. Includes matching algorithms and real-time chat.',
    stargazers_count: 1240,
    language: 'TypeScript',
    html_url: 'https://github.com',
    owner: {
      login: 'react-dev',
      avatar_url: 'https://picsum.photos/50/50?random=1'
    },
    topics: ['react-native', 'dating', 'firebase', 'social']
  },
  {
    id: 2,
    name: 'pet-adoption-platform',
    full_name: 'animals-love/pet-adoption-platform',
    description: 'Open source platform connecting shelters with potential pet owners. Features geolocation search and appointment booking.',
    stargazers_count: 890,
    language: 'JavaScript',
    html_url: 'https://github.com',
    owner: {
      login: 'animals-love',
      avatar_url: 'https://picsum.photos/50/50?random=2'
    },
    topics: ['adoption', 'pets', 'mern-stack', 'mongodb']
  },
  {
    id: 3,
    name: 'tinder-card-stack',
    full_name: 'ui-components/tinder-card-stack',
    description: 'A lightweight, zero-dependency swipeable card stack component for React. Smooth animations and gesture support.',
    stargazers_count: 3400,
    language: 'TypeScript',
    html_url: 'https://github.com',
    owner: {
      login: 'ui-wizard',
      avatar_url: 'https://picsum.photos/50/50?random=3'
    },
    topics: ['react', 'ui-library', 'animation', 'swipe']
  },
  {
    id: 4,
    name: 'dog-walker-uber',
    full_name: 'startup-ideas/dog-walker-uber',
    description: 'Uber for dog walkers. Real-time tracking of walks, payment integration with Stripe, and review system.',
    stargazers_count: 560,
    language: 'Python',
    html_url: 'https://github.com',
    owner: {
      login: 'django-master',
      avatar_url: 'https://picsum.photos/50/50?random=4'
    },
    topics: ['django', 'python', 'marketplace', 'geolocation']
  },
  {
    id: 5,
    name: 'ShelterConnect',
    full_name: 'nonprofit/ShelterConnect',
    description: 'Helping animal shelters manage inventory and foster parents. Built with Next.js and Supabase.',
    stargazers_count: 2100,
    language: 'TypeScript',
    html_url: 'https://github.com',
    owner: {
      login: 'good-cause',
      avatar_url: 'https://picsum.photos/50/50?random=5'
    },
    topics: ['nextjs', 'supabase', 'nonprofit', 'management']
  }
];