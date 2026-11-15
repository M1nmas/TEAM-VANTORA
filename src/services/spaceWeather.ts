export type EventType = 'Solar flare' | 'CME' | 'Geomagnetic'
export type Severity = 'Low' | 'Moderate' | 'High'

export type SpaceEvent = {
  id: number
  type: EventType
  title: string
  time: string
  detail: string
  severity: Severity
  icon: string
}

export type SpaceWeatherSnapshot = {
  events: SpaceEvent[]
  kp: number
  prediction: {
    score: number
    level: 'Quiet' | 'Watch' | 'Elevated'
    confidence: 'low' | 'moderate' | 'high'
    basis: string
  }
  fetchedAt: string
  sources: {
    nasa: boolean
    noaa: boolean
    apod: boolean
  }
  apodTitle?: string
}

const nasaBaseUrl = 'https://api.nasa.gov'
const noaaKpUrl = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'

const fallbackEvents: SpaceEvent[] = [
  { id: 1, type: 'Solar flare', title: 'M2.1 flare detected', time: 'Today, 14:32 UTC', detail: 'Active region AR 3890', severity: 'Moderate', icon: 'flare' },
  { id: 2, type: 'CME', title: 'Earth-directed CME', time: 'Today, 09:18 UTC', detail: 'Estimated arrival: Nov 17', severity: 'High', icon: 'cme' },
  { id: 3, type: 'Solar flare', title: 'C4.8 flare detected', time: 'Yesterday, 21:06 UTC', detail: 'Active region AR 3887', severity: 'Low', icon: 'flare' },
  { id: 4, type: 'Geomagnetic', title: 'Kp index reached 4', time: 'Yesterday, 16:40 UTC', detail: 'Minor geomagnetic activity', severity: 'Moderate', icon: 'wave' },
]

const formatTime = (value?: string) => value
  ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC'
  : 'Time unavailable'

const severityFromFlare = (classType = ''): Severity => {
  const first = classType.toUpperCase().charAt(0)
  return first === 'X' ? 'High' : first === 'M' ? 'Moderate' : 'Low'
}

const severityFromKp = (kp: number): Severity => kp >= 6 ? 'High' : kp >= 4 ? 'Moderate' : 'Low'

async function nasaJson<T>(path: string, apiKey: string): Promise<T> {
  const response = await fetch(`${nasaBaseUrl}${path}${path.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(apiKey)}`)
  if (!response.ok) throw new Error(`NASA request failed: ${response.status}`)
  return response.json() as Promise<T>
}

async function fetchNasaEvents(apiKey: string, startDate: string, endDate: string): Promise<SpaceEvent[]> {
  const [flares, cmes, storms] = await Promise.all([
    nasaJson<Array<{ flrID?: string; beginTime?: string; classType?: string; sourceLocation?: string }>>(`/DONKI/FLR?startDate=${startDate}&endDate=${endDate}`, apiKey),
    nasaJson<Array<{ activityID?: string; startTime?: string; note?: string; cmeAnalyses?: Array<{ isMostAccurate?: boolean }> }>>(`/DONKI/CME?startDate=${startDate}&endDate=${endDate}`, apiKey),
    nasaJson<Array<{ gstID?: string; startTime?: string; allKpIndex?: Array<{ kpIndex?: number }> }>>(`/DONKI/GST?startDate=${startDate}&endDate=${endDate}`, apiKey),
  ])

  const flareEvents = flares.map((flare, index) => ({
    id: index + 1,
    type: 'Solar flare' as const,
    title: `${flare.classType || 'Unknown'} flare detected`,
    time: formatTime(flare.beginTime),
    detail: flare.sourceLocation ? `Source ${flare.sourceLocation}` : 'Solar region not reported',
    severity: severityFromFlare(flare.classType),
    icon: 'flare',
  }))
  const cmeEvents = cmes.map((cme, index) => ({
    id: 100 + index,
    type: 'CME' as const,
    title: cme.note?.toLowerCase().includes('earth') ? 'Earth-directed CME' : 'Coronal mass ejection',
    time: formatTime(cme.startTime),
    detail: cme.cmeAnalyses?.length ? 'Analysis available from DONKI' : 'Analysis pending',
    severity: cme.note?.toLowerCase().includes('earth') ? 'High' as const : 'Moderate' as const,
    icon: 'cme',
  }))
  const stormEvents = storms.map((storm, index) => {
    const kp = Math.max(...(storm.allKpIndex || []).map((item) => Number(item.kpIndex) || 0), 0)
    return {
      id: 200 + index,
      type: 'Geomagnetic' as const,
      title: `Kp index reached ${kp}`,
      time: formatTime(storm.startTime),
      detail: kp >= 5 ? 'Geomagnetic storm conditions' : 'Minor geomagnetic activity',
      severity: severityFromKp(kp),
      icon: 'wave',
    }
  })

  return [...flareEvents, ...cmeEvents, ...stormEvents]
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
    .slice(0, 12)
}

async function fetchNoaaKp(): Promise<number> {
  const response = await fetch(noaaKpUrl)
  if (!response.ok) throw new Error(`NOAA request failed: ${response.status}`)
  const rows = await response.json() as string[][]
  return Math.max(...rows.slice(1).map((row) => Number(row[1]) || 0), 0)
}

export async function fetchSpaceWeather(apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'): Promise<SpaceWeatherSnapshot> {
  const end = new Date()
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startDate = start.toISOString().slice(0, 10)
  const endDate = end.toISOString().slice(0, 10)

  const [nasaResult, noaaResult, apodResult] = await Promise.allSettled([
    fetchNasaEvents(apiKey, startDate, endDate),
    fetchNoaaKp(),
    nasaJson<{ title?: string }>('/planetary/apod', apiKey),
  ])

  const events = nasaResult.status === 'fulfilled' && nasaResult.value.length ? nasaResult.value : fallbackEvents
  const kp = noaaResult.status === 'fulfilled' ? noaaResult.value : 4
  const flareCount = events.filter((event) => event.type === 'Solar flare').length
  const cmeCount = events.filter((event) => event.type === 'CME').length
  const stormCount = events.filter((event) => event.type === 'Geomagnetic').length
  const score = Math.min(98, Math.max(8, Math.round((kp * 9) + (flareCount * 2) + (cmeCount * 7) + (stormCount * 4))))
  return {
    events,
    kp,
    prediction: {
      score,
      level: score >= 70 ? 'Elevated' : score >= 40 ? 'Watch' : 'Quiet',
      confidence: nasaResult.status === 'fulfilled' && noaaResult.status === 'fulfilled' ? 'moderate' : 'low',
      basis: `${flareCount} flares, ${cmeCount} CMEs, ${stormCount} geomagnetic signals and Kp ${kp}`,
    },
    fetchedAt: new Date().toISOString(),
    sources: {
      nasa: nasaResult.status === 'fulfilled',
      noaa: noaaResult.status === 'fulfilled',
      apod: apodResult.status === 'fulfilled',
    },
    apodTitle: apodResult.status === 'fulfilled' ? apodResult.value.title : undefined,
  }
}
