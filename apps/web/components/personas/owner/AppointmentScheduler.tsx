'use client';

import { useState } from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  addDays,
  addMinutes,
} from 'date-fns';
import { Button } from '@/components/ui/button';

// Simple in-memory slot map for demo purposes
const createSlotMap = () => {
  const today = new Date();
  return {
    [format(today, 'yyyy-MM-dd')]: ['09:00', '11:00', '14:00'],
    [format(addDays(today, 1), 'yyyy-MM-dd')]: ['10:00', '15:00'],
  } as Record<string, string[]>;
};

export function AppointmentScheduler() {
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reserved, setReserved] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const slots = createSlotMap();

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  const availableSlots = selectedDate
    ? (slots[format(selectedDate, 'yyyy-MM-dd')] ?? [])
    : [];

  const confirm = () => {
    if (!selectedDate || !selectedTime) return;
    const iso = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`;
    setReserved((prev) => new Set(prev).add(iso));
    setMessage(
      `Visita agendada para ${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime}`,
    );
  };

  const exportIcs = () => {
    if (!selectedDate || !selectedTime) return;
    const start = new Date(
      `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`,
    );
    const end = addMinutes(start, 60);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'SUMMARY:Visita técnica',
      `DTSTART:${format(start, "yyyyMMdd'T'HHmmss")}`,
      `DTEND:${format(end, "yyyyMMdd'T'HHmmss")}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'visita.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" aria-label="Agendador de visitas">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          aria-label="mês anterior"
        >
          ◀
        </Button>
        <span aria-live="polite">{format(month, 'MMMM yyyy')}</span>
        <Button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          aria-label="próximo mês"
        >
          ▶
        </Button>
      </div>
      <div
        role="grid"
        className="grid grid-cols-7 gap-1 text-center"
        aria-label="Calendário"
      >
        {days.map((day) => (
          <button
            key={day.toISOString()}
            type="button"
            role="gridcell"
            aria-selected={isSameDay(day, selectedDate)}
            onClick={() => setSelectedDate(day)}
            className={`p-2 rounded ${
              isSameDay(day, selectedDate)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
      {selectedDate && (
        <div className="space-y-2">
          <h2 className="text-sm" id="slots">
            Horários disponíveis
          </h2>
          <div
            role="listbox"
            aria-labelledby="slots"
            className="flex flex-wrap gap-2"
          >
            {availableSlots.map((time) => {
              const iso = `${format(selectedDate, 'yyyy-MM-dd')}T${time}:00`;
              const isReserved = reserved.has(iso);
              return (
                <button
                  key={time}
                  type="button"
                  role="option"
                  aria-selected={selectedTime === time}
                  aria-disabled={isReserved}
                  disabled={isReserved}
                  onClick={() => setSelectedTime(time)}
                  className={`px-2 py-1 rounded border ${
                    isReserved
                      ? 'opacity-50'
                      : selectedTime === time
                        ? 'bg-primary text-primary-foreground'
                        : ''
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={confirm}
          disabled={!selectedDate || !selectedTime}
          aria-label="confirmar visita"
        >
          Confirmar
        </Button>
        <Button
          type="button"
          onClick={exportIcs}
          disabled={!selectedDate || !selectedTime}
          aria-label="exportar iCal"
        >
          Exportar iCal
        </Button>
      </div>
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
