import React from 'react';
import { motion } from 'framer-motion';
import { GameTimer as GameTimerType } from '../../types';

interface GameTimerProps {
  timer: GameTimerType;
}

const GameTimer: React.FC<GameTimerProps> = ({ timer }) => {
  const { minutes, seconds, isActive, totalSeconds } = timer;
  
  // Calculate percentage for progress ring
  const initialTime = minutes === 3 ? 180 : minutes === 2 ? 120 : 60; // Based on round type
  const progress = totalSeconds / initialTime;
  
  // Color based on time remaining
  const getTimerColor = () => {
    if (totalSeconds > 60) return 'text-green-600';
    if (totalSeconds > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRingColor = () => {
    if (totalSeconds > 60) return 'stroke-green-500';
    if (totalSeconds > 30) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  if (!isActive && totalSeconds === 0) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-sm">⏰</span>
        </div>
        <span className="text-gray-500 text-sm">Ready</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Circular Progress Timer */}
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={getRingColor()}
            style={{
              strokeDasharray: `${2 * Math.PI * 45}`,
            }}
            animate={{
              strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress)}`,
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </svg>
        
        {/* Timer text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`font-bold text-sm ${getTimerColor()}`}
            animate={totalSeconds <= 10 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: totalSeconds <= 10 ? Infinity : 0, duration: 1 }}
          >
            {minutes}:{seconds.toString().padStart(2, '0')}
          </motion.span>
        </div>
      </div>

      {/* Timer status text */}
      <div className="text-sm">
        <motion.p 
          className={`font-semibold ${getTimerColor()}`}
          animate={totalSeconds <= 10 ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ repeat: totalSeconds <= 10 ? Infinity : 0, duration: 1 }}
        >
          {totalSeconds <= 10 ? '⚡ Hurry up!' : 'Time remaining'}
        </motion.p>
        <p className="text-gray-500 text-xs">
          {isActive ? 'Styling in progress...' : 'Round ended'}
        </p>
      </div>

      {/* Pulse effect for urgency */}
      {totalSeconds <= 30 && isActive && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-red-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: 'easeInOut'
          }}
        />
      )}
    </div>
  );
};

export default GameTimer;