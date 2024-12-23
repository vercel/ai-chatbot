'use client'

import useSWR from 'swr'
import { useChatDispatch } from '@/context/chatContext'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { Session } from '@/lib/types'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useEffect, useState } from 'react'
import { getUser } from '@/app/(chat)/chat/[id]/actions'


const fetcher = async (url: string) => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` }
    })
    const data = await response.json()

    const enabled = data.records.filter((record: any) => record.fields.Status === 'Enabled').sort((a: any, b: any) => a.fields.Name.localeCompare(b.fields.Name))
    return enabled
  }

export default function AirtableSelector({ session }: Session) {
  const { data, error, mutate } = useSWR('https://api.airtable.com/v0/appXGJ0AU1gC2RFga/chats', fetcher)
  const dispatch = useChatDispatch() as any
  const [_, setModel] = useLocalStorage('model', {} as any)

  useEffect(() => {
    if (_) {
      dispatch({ type: 'update', payload: _ })
    }
  }, [dispatch, _])

  const [user, setUser] = useState({})

   useEffect(() => {
    if (session?.user) {
      getUser(session.user.email).then(userInfo => {
        setUser(userInfo as unknown as Session)
      })
    }
  }, [session?.user])

  const { plan } = user;
  
  useEffect(() => {
    if (plan && data?.length > 0) {
      if (plan === 'free') {
        const model = data.filter((record: any) => record.fields.plan === 'free')
        mutate(model)
      }

      if (plan === 'basic') {
        const model = data.filter((record: any) => record.fields.plan ===  'basic')
        mutate(model)
      }
    }
  }, [plan])

  if (error) return <div>Failed to load data</div>
  if (!data) return <div>Loading...</div>

  const handleChange = (value: {}) => {
    const model = data.find((record: any) => record.fields.Name === value)
    setModel(model.fields)
    dispatch({ type: 'update', payload: model.fields })
  }

  return (
    <div>
        <Select onValueChange={handleChange} defaultValue={_.Name}>
            <SelectTrigger className="w-[180px]" >
                <SelectValue placeholder="Selecionar modelo" />
            </SelectTrigger>
            <SelectContent>
            <SelectGroup>
                <SelectLabel>Modelos</SelectLabel>
                {data?.map((record: any) => {
                  const recordPlan = record.fields.plan
                  const lock = {
                    free: recordPlan !== 'free',
                    basic: recordPlan === 'premium',
                    premium: false,
                  }
                  return (
                    <SelectItem key={record.id} value={record.fields.Name} lock={lock[plan]}>
                      {record.fields.Name}
                    </SelectItem>
                  )
                })}
            </SelectGroup>
            </SelectContent>
        </Select>
    </div>
  )
}