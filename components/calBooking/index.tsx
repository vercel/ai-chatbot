import { getCalApi } from '@calcom/embed-react'
import { useEffect } from 'react'
import { Button } from '../ui/button'

export const CalBooking = () => {
  useEffect(() => {
    ;(async function () {
      const cal = await getCalApi({})
      cal('ui', {
        styles: { branding: { brandColor: '#000000' } },
        hideEventTypeDetails: false,
        layout: 'month_view'
      })
    })()
  }, [])
  return (
    <Button
      data-cal-namespace=""
      data-cal-link="superbrain/get-started"
      data-cal-config='{"layout":"month_view"}'
    >
      <span className="hidden md:flex font-bold">Contact Sales</span>
    </Button>
  )
}
