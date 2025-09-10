export type Channel = "whatsapp"|"telegram"|"email"|"sms"
export type Region = "N"|"NE"|"CO"|"SE"|"S"

export type EnergyProfile = {
  consumption_kWh_month_range: [number, number]
  suggested_kWp_range: [number, number]
  tiers: string[]
}

export type ChannelWhatsApp = {
  header?: string
  body: string
  footer?: string
  cta?: { text: string; url_template?: string }
}
export type ChannelTelegram = { text: string; keyboard?: string[] }
export type ChannelEmail = { subject: string; preheader?: string }
export type ChannelSMS = string

export type RegionSpec = {
  value_prop: string
  whatsapp?: ChannelWhatsApp
  telegram?: ChannelTelegram
  email?: ChannelEmail
  sms?: ChannelSMS
}

export type Persona = {
  id: string
  class: string
  label: string
  energy_profile: EnergyProfile
  regions: Record<Region, RegionSpec>
}

export type PersonasDoc = {
  version: string
  context: string
  personas: Persona[]
}

export type ComposeRequest = {
  personaId: string
  region: Region
  channel: Channel
  variables?: Record<string, string>
  marketing?: boolean
}

export type ComposeResponse = {
  channel: Channel
  raw: Record<string, any>
  rendered: Record<string, string>
  placeholdersUsed: string[]
  compliance: { status: "pass"|"fail"; errors: string[] }
}
