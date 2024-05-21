'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { TimePicker } from './time-picker'
import { DatePicker } from './date-picker'
import { useActions, useUIState } from 'ai/rsc/dist'
import { AI } from '@/lib/chat/actions'

export interface NewEvent {
  name: string
  location?: string
  start?: string
  end?: string
  invitees?: string[]
}

export function CreateEvent({
  name,
  location,
  start,
  end,
  invitees = []
}: NewEvent & { status: 'requires_action' | 'completed' }) {
  const [eventName, setEventName] = useState(name)
  const [eventLocation, setEventLocation] = useState(location)
  const [startDate, setStartDate] = useState<Date | undefined>(
    start ? new Date(start) : new Date()
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    end ? new Date(end) : new Date()
  )
  const [, setMessages] = useUIState<typeof AI>()
  const [confirmingUI, setConfirmingUI] = useState<null | React.ReactNode>(null)

  const { confirmEvent } = useActions()

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventName(e.currentTarget.value)
  }

  const onLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventLocation(e.currentTarget.value)
  }

  const onConfirm = async () => {
    const response = await confirmEvent()
    setConfirmingUI(response.schedulingUI)
    setMessages((currentMessages: any) => [
      ...currentMessages,
      response.newMessage
    ])
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      {confirmingUI ? (
        confirmingUI
      ) : (
        <>
          {/* NAME */}
          <div>
            <Label htmlFor="event-name">Name</Label>
            <Input
              id="event-name"
              onChange={onNameChange}
              placeholder="New Event"
              value={eventName}
              required
            />
          </div>
          {/* LOCATION */}
          <div>
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-name"
              onChange={onLocationChange}
              placeholder="AriAri"
              value={eventLocation}
            />
          </div>
          {/* STAR */}
          <div className="flex gap-2 items-center">
            <Label htmlFor="event-date">Starts</Label>
            <DatePicker date={startDate} setDate={setStartDate} />
            <TimePicker date={startDate} setDate={setStartDate} />
          </div>
          {/* EVENT START TIME */}
          <div className="flex gap-2 items-center">
            <Label htmlFor="event-name">Ends</Label>
            <DatePicker date={endDate} setDate={setEndDate} />
            <TimePicker date={endDate} setDate={setEndDate} />
          </div>
          <Button onClick={onConfirm}>Confirm</Button>
        </>
      )}
    </div>
  )
}
