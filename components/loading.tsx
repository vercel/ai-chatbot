'use client';

import React, { useEffect, useState } from 'react';


const opacity = ['opacity-25', 'opacity-50', 'opacity-100'];

export function LoadingGrid() {
  const [dots, setDots] = useState([1, 2, 0, 0, 0, 0, 0, 0]);

  const intervalTime = 100;

  useEffect(() => {
    const sequence = [
      [1, 2, 0, 0, 0, 0],
      [0, 1, 0, 2, 0, 0],
      [0, 0, 0, 1, 0, 2],
      [0, 0, 0, 0, 2, 1],
      [0, 0, 2, 0, 1, 0],
      [2, 0, 1, 0, 0, 0],
    ];
    let sequenceIndex = 0;

    const intervalId = setInterval(() => {
      setDots(sequence[sequenceIndex]);
      sequenceIndex++;
      if (sequenceIndex >= sequence.length) sequenceIndex = 0;
    }, intervalTime);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex h-12 items-center justify-center">
      <div className="grid grid-cols-3 gap-3">
        {dots.map((dot, index) => (
          <div
        
          key={index}
            className={`h-1 w-1 rounded-full bg-zinc-400 ${
              opacity[dot]
            }
            duration- transition-all ease-in-out${intervalTime / 1000}s`}
        />
        ))}
      </div>
    </div>
  );
}
