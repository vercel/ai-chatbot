'use client'

import useSWR from 'swr'
import { useChatDispatch } from '@/context/chatContext'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useEffect } from 'react'

const fetcher = async (url: string) => {
    const response = await fetch(url, {
      // headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` }
      headers: { Authorization: 'Bearer patmQDkI1KUCciLMg.117212fd98ddde08d409247b1dce48032bbabc5cb794516edd417f9e7c7e7d37'}
    })
    const data = await response.json()
    const enabled = data.records.filter((record: any) => record.fields.Status === 'Enabled').sort((a: any, b: any) => a.fields.Name.localeCompare(b.fields.Name))
    return enabled
  }

const AirtableSelector = () => {
  const [subscriber, setSubscriber] = useLocalStorage('plan', {} as any)
  const { data, error, mutate } = useSWR('https://api.airtable.com/v0/appXGJ0AU1gC2RFga/chats', fetcher)
  const dispatch = useChatDispatch() as any
  const [_, setModel] = useLocalStorage('model', {} as any)

  useEffect(() => {
    if (_) {
      dispatch({ type: 'update', payload: _ })
    }
  }, [dispatch, _])

  useEffect(() => {
    if (subscriber?.plan && data?.length > 0) {

      if (subscriber.plan === 'free') {
        const model = data.filter((record: any) => record.fields.plan ===  'free')
        mutate(model)
      }

      if (subscriber.plan === 'basico') {
        const model = data.filter((record: any) => record.fields.plan ===  'basic')
        mutate(model)
      }
    }
  }, [subscriber, data, mutate])

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
                { data?.map((record: any) => (
                    <SelectItem key={record.id} value={record.fields.Name}>
                        {record.fields.Name}
                    </SelectItem>
                )) }
            </SelectGroup>
            </SelectContent>
        </Select>
    </div>
  )
}


export default AirtableSelector
