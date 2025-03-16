'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// A simple date picker component that doesn't rely on react-day-picker
export function Calendar({
  selected,
  onSelect,
  className,
  disabled
}: {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());
  
  // Get days in current month view
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get day of week (0-6) for first day of month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  
  // Get month name
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  
  // Generate days array
  const days = [];
  // Add empty slots for days before first of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };
  
  // Handle date selection
  const handleSelectDate = (day: number) => {
    if (disabled) return;
    if (onSelect) {
      onSelect(new Date(year, month, day));
    }
  };
  
  // Check if a day is the selected day
  const isSelectedDay = (day: number) => {
    if (!selected) return false;
    return (
      selected.getFullYear() === year &&
      selected.getMonth() === month &&
      selected.getDate() === day
    );
  };
  
  // Check if a day is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };
  
  return (
    <div className={cn("p-3 select-none", className)}>
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={prevMonth} 
          disabled={disabled}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="font-medium">
          {monthName} {year}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={nextMonth} 
          disabled={disabled}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
          <div key={i} className="text-cornsilk-300 text-xs mb-1">
            {day}
          </div>
        ))}
        
        {days.map((day, i) => (
          <div key={i} className="p-1">
            {day ? (
              <button
                type="button"
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-full",
                  isSelectedDay(day) && "bg-cornsilk-500 text-hunter_green-900",
                  isToday(day) && !isSelectedDay(day) && "bg-hunter_green-600 text-cornsilk-500",
                  !isSelectedDay(day) && !isToday(day) && "hover:bg-hunter_green-600",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleSelectDate(day)}
                disabled={disabled}
              >
                {day}
              </button>
            ) : (
              <div className="h-7 w-7"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}