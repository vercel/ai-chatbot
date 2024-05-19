'use client'

import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react'
import {
  viewWeek,
  viewDay,
  viewMonthGrid,
  viewMonthAgenda
} from '@schedule-x/calendar'
import '@schedule-x/theme-default/dist/index.css'
import { NewEvent } from '.'

export function InteractiveCalendar({
  props
}: {
  props: NewEvent & { status: 'requires_action' | 'completed' }
}) {
  const calendar = useCalendarApp({
    defaultView: viewWeek.name,
    views: [viewDay, viewWeek, viewMonthGrid, viewMonthAgenda],
    events: [
      {
        id: '1',
        title: 'Event 1',
        start: '2024-05-16',
        end: '2023-05-17'
      }
    ]
  })

  return (
    <div>
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  )
}
