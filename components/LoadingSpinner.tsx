'use client'

import React, { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { Logo } from '@/components/Logo';

const subtexts = [
  "Unearthing your treasures",
  "Polishing your gems",
  "Mining for good habits",
  "Stumbling upon brilliance",
  "Discovering your potential",
  "Crafting your success story",
  "Forging new paths",
  "Summoning success",
  "Brewing brilliance",
  "Charging up your awesome",
  "Assembling achievements",
  "Leveling up your day",
  "Questing for quality",
  "Unlocking awesomeness",
  "Plotting your progress",
];

const LoadingSpinner: React.FC = () => {
  const [currentSubtext, setCurrentSubtext] = useState<string>('Loading your data');
  const [animatedDots, setAnimatedDots] = useState<string>('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * subtexts.length);
    setCurrentSubtext(subtexts[randomIndex]);

    const dotAnimationInterval = setInterval(() => {
      setAnimatedDots(prevDots => {
        if (prevDots.length >= 3) {
          return '';
        }
        return prevDots + '.';
      });
    }, 200); // Adjust timing as needed

    return () => clearInterval(dotAnimationInterval);
  }, []);


  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Coins className="h-12 w-12 animate-bounce text-yellow-500" />
        <Logo />
        {currentSubtext && (
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {currentSubtext}{animatedDots}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
