import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchSpaceWeather, type EventType, type SpaceWeatherSnapshot } from './services/spaceWeather'
import { ThreeSpaceScene } from './components/ThreeSpaceScene'
import './App.css'

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-14.5-4L3 10" /><path d="M3 4v6h6M4 13a8.1 8.1 0 0 0 14.5 4L21 14" /><path d="M21 20v-6h-6" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    chevron: <path d="m7 9 5 5 5-5" />,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function LiveActivityView({ snapshot, simulationOffset, setSimulationOffset, onRefresh }: { snapshot?: SpaceWeatherSnapshot; simulationOffset: number; setSimulationOffset: (value: number) => void; onRefresh: () => void }) {
  const events = snapshot?.events || []
  const kp = snapshot?.kp || 4
  const [scenario, setScenario] = useState('Current conditions')
  const [horizon, setHorizon] = useState(24)
  const flareCount = events.filter((event) => event.type === 'Solar flare').length
  const cmeCount = events.filter((event) => event.type === 'CME').length
  const scenarioBoost = scenario === 'CME arrival' ? 18 : scenario === 'Solar flare burst' ? 12 : 0
  const score = Math.min(98, Math.max(8, (snapshot?.prediction.score || Math.round((kp * 9) + (flareCount * 2) + (cmeCount * 7))) + scenarioBoost + simulationOffset))
  const level = score >= 70 ? 'Elevated' : score >= 40 ? 'Watch' : 'Quiet'
  const confidence = snapshot?.sources.nasa && snapshot.sources.noaa ? 'moderate' : 'low'
  const forecast = score >= 70 ? 'Increased chance of communication and satellite disruption.' : score >= 40 ? 'Minor disruption is possible; continue monitoring the next update.' : 'No significant disruption signal in the current inputs.'

  return <div className="activity-view">
    <section className="hero-section activity-hero">
      <div><div className="eyebrow"><span className="live-pulse" /> LIVE ACTIVITY LAB</div><h1>Simulate what comes next<span className="accent">.</span></h1><p className="hero-subtitle">Adjust the scenario and horizon to explore a transparent space-weather prediction.</p></div>
      <button className="sync-button" onClick={onRefresh}><Icon name="refresh" size={16} /> Refresh live inputs</button>
    </section>
    <div className="simulation-layout">
      <section className="panel simulator-panel">
        <div className="panel-heading"><div><h2>Prediction controls</h2><p>Powered by NASA DONKI + NOAA SWPC inputs</p></div><span className="sim-badge">SIMULATION</span></div>
        <label className="control-label">Scenario<select value={scenario} onChange={(event) => setScenario(event.target.value)}><option>Current conditions</option><option>CME arrival</option><option>Solar flare burst</option></select></label>
        <label className="control-label">Forecast horizon <strong>{horizon} hours</strong><input type="range" min="6" max="72" step="6" value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} /><span className="range-labels"><span>6h</span><span>72h</span></span></label>
        <label className="control-label">Sensitivity <strong>{simulationOffset > 0 ? '+' : ''}{simulationOffset}</strong><input type="range" min="-20" max="20" value={simulationOffset} onChange={(event) => setSimulationOffset(Number(event.target.value))} /><span className="range-labels"><span>Conservative</span><span>More sensitive</span></span></label>
        <div className="input-chips"><span>Flares: {flareCount}</span><span>CMEs: {cmeCount}</span><span>Kp: {kp}</span></div>
      </section>
      <section className={`panel forecast-panel ${level.toLowerCase()}`}>
        <div className="forecast-top"><span className="metric-label">SIMULATED {horizon}H OUTLOOK</span><span className="confidence-dot" /> <span className="confidence-label">{confidence} confidence</span></div>
        <div className="forecast-score">{score}<small>%</small></div>
        <div className="forecast-level">{level} activity</div>
        <p>{forecast}</p>
        <div className="forecast-bar"><i style={{ width: `${score}%` }} /></div>
        <div className="forecast-foot"><span>Input-based heuristic</span><span>Updated {snapshot ? new Date(snapshot.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span></div>
      </section>
    </div>
    <section className="panel activity-feed-panel">
      <div className="panel-heading"><div><h2>Live event stream</h2><p>Signals currently feeding the simulation</p></div><span className="live-tag"><i /> {events.length} signals</span></div>
      <div className="stream-grid">{events.slice(0, 6).map((event) => <div className="stream-card" key={event.id}><div className={`event-symbol ${event.icon}`}><Icon name={event.icon === 'flare' ? 'sun' : event.icon === 'cme' ? 'map' : 'activity'} size={17} /></div><div><strong>{event.title}</strong><span>{event.time}</span></div><b className={`severity ${event.severity.toLowerCase()}`}>{event.severity}</b></div>)}</div>
    </section>
    <div className="simulation-disclaimer"><Icon name="info" size={15} /> Simulation output is an educational estimate, not an official NOAA/NASA forecast or emergency alert.</div>
  </div>
}

function LearnView({ simulationOffset, setSimulationOffset }: { simulationOffset: number; setSimulationOffset: (value: number) => void }) {
  const examples = [
    ['Solar flares', 'Sudden bursts of X-ray and ultraviolet energy.', 'Travel time: about 8 minutes', 'flare'],
    ['Coronal mass ejections', 'Large clouds of magnetised plasma from the Sun.', 'Arrival: 1–3 days', 'cme'],
    ['Geomagnetic storms', 'Changes in Earth’s magnetic field after solar activity.', 'Measured with Kp index', 'wave'],
  ]
  return <div className="learn-view">
    <section className="hero-section"><div><div className="eyebrow"><span className="live-pulse" /> SPACE WEATHER 101</div><h1>Learn, then test a scenario<span className="accent">.</span></h1><p className="hero-subtitle">Understand the signals that power the Live activity simulation.</p></div></section>
    <div className="learn-grid">{examples.map(([title, description, fact, icon]) => <article className="panel lesson-card" key={title}><div className={`lesson-icon ${icon}`}><Icon name={icon === 'flare' ? 'sun' : icon === 'cme' ? 'map' : 'activity'} size={20} /></div><h2>{title}</h2><p>{description}</p><span>{fact}</span></article>)}</div>
    <section className="panel learn-sim-card"><div><span className="eyebrow">TRY THE MODEL</span><h2>How does sensitivity change a prediction?</h2><p>Move the control to see how the same live signals can produce a more conservative or more sensitive awareness estimate.</p></div><div className="learn-control"><strong>{simulationOffset > 0 ? '+' : ''}{simulationOffset} sensitivity</strong><input aria-label="Learn simulation sensitivity" type="range" min="-20" max="20" value={simulationOffset} onChange={(event) => setSimulationOffset(Number(event.target.value))} /><span>Use Live activity for full scenario controls →</span></div></section>
  </div>
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [activeFilter, setActiveFilter] = useState<'All events' | EventType>('All events')
  const [search, setSearch] = useState('')
  const [snapshot, setSnapshot] = useState<SpaceWeatherSnapshot>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('loading')
  const [simulationOffset, setSimulationOffset] = useState(0)
  const [timeRange, setTimeRange] = useState('Last 24 hours')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const nextSnapshot = await fetchSpaceWeather()
      setSnapshot(nextSnapshot)
      setLastUpdated(new Date(nextSnapshot.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      if (!nextSnapshot.sources.nasa || !nextSnapshot.sources.noaa) setError('Some live feeds were unavailable; showing fallback data for those feeds.')
    } catch {
      setError('Live feeds are unavailable; showing the last simulation dataset.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const events = snapshot?.events || []
  const kp = snapshot?.kp || 4
  const filteredEvents = useMemo(() => (snapshot?.events || []).filter((event) => {
    const matchesFilter = activeFilter === 'All events' || event.type === activeFilter
    const query = search.toLowerCase()
    return matchesFilter && `${event.title} ${event.detail} ${event.type}`.toLowerCase().includes(query)
  }), [activeFilter, search, snapshot])

  const refreshData = () => { void loadData() }
  const flareCount = events.filter((event) => event.type === 'Solar flare').length
  const cmeCount = events.filter((event) => event.type === 'CME').length
  const simulationScore = Math.min(98, Math.max(8, (snapshot?.prediction.score || Math.round((kp * 9) + (flareCount * 2) + (cmeCount * 7))) + simulationOffset))
  const simulationLevel = simulationScore >= 70 ? 'Elevated' : simulationScore >= 40 ? 'Watch' : 'Quiet'

  return (
    <div className="app-shell">
      <div className="space-background" aria-hidden="true"><ThreeSpaceScene /></div>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="sun" size={21} /></div>
          <span>Solar<span>Shield</span></span>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {[
            ['Overview', 'grid'],
            ['Live activity', 'activity'],
            ['Learn', 'book'],
          ].map(([label, icon]) => (
            <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav(label)}>
              <Icon name={icon} size={18} /> {label}
              {label === 'Live activity' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="source-card">
            <div className="source-icon"><Icon name="info" size={16} /></div>
            <div>
              <strong>About the data</strong>
              <p>NASA + NOAA live feeds</p>
            </div>
            <Icon name="arrow" size={14} />
          </div>
          <div className="user-row">
            <div className="avatar">AM</div>
            <div><strong>Alex Morgan</strong><span>Student account</span></div>
            <Icon name="chevron" size={15} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{activeNav}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications"><Icon name="bell" size={19} /><i /></button>
            <div className="top-avatar">AM</div>
          </div>
        </header>

        <div className="content-wrap">
          {activeNav === 'Live activity' ? <LiveActivityView snapshot={snapshot} simulationOffset={simulationOffset} setSimulationOffset={setSimulationOffset} onRefresh={refreshData} /> : activeNav === 'Learn' ? <LearnView simulationOffset={simulationOffset} setSimulationOffset={setSimulationOffset} /> : <>
          <section className="briefing-head">
            <div><div className="eyebrow"><span className="live-pulse" /> MISSION CONTROL / OVERVIEW</div><h1>Your space-weather briefing</h1><p>Solar activity, translated into a clearer picture.</p><small>Sample period: {timeRange.toLowerCase()} · Updated {lastUpdated} · All times UTC</small></div>
            <div className="briefing-actions"><span>DATA SOURCE: NASA DONKI</span><label className="time-select"><select aria-label="Select briefing time range" value={timeRange} onChange={(event) => setTimeRange(event.target.value)}><option>Last 24 hours</option><option>Last 7 days</option><option>Last 30 days</option></select><Icon name="chevron" size={13} /></label><button className="sync-button" onClick={refreshData}><Icon name="refresh" size={15} /> Sync live data</button></div>
          </section>
          {error && <div className="feed-notice"><Icon name="info" size={14} /> {error}</div>}

          <section className="briefing-metrics">
            <article className="briefing-metric"><span>Solar flares</span><strong>{isLoading ? '—' : String(flareCount).padStart(2, '0')}</strong><small>24 H</small><p>{flareCount > 0 ? `${flareCount} active signals` : 'No events recorded'}</p></article>
            <article className="briefing-metric"><span>Coronal mass ejections</span><strong>{isLoading ? '—' : String(cmeCount).padStart(2, '0')}</strong><small>24 H</small><p>{cmeCount > 0 ? '1 Earth-directed candidate' : 'No candidates detected'}</p></article>
            <article className="briefing-metric"><span>Geomagnetic storms</span><strong>{isLoading ? '—' : String(events.filter((event) => event.type === 'Geomagnetic').length).padStart(2, '0')}</strong><small>24 H</small><p>Kp {kp} · {simulationLevel.toLowerCase()} activity</p></article>
            <article className="briefing-metric awareness"><span>Awareness level</span><strong>{simulationLevel}</strong><small>LIVE</small><p>{simulationScore >= 70 ? 'Some systems may be affected' : 'Most systems operating normally'}</p></article>
          </section>

          <section className="briefing-middle">
            <div className="timeline-panel">
              <div className="panel-heading"><div><h2>Solar activity timeline</h2><p>Number of events in each 4-hour window</p></div><div className="range-pills"><button className={timeRange === 'Last 24 hours' ? 'active' : ''} onClick={() => setTimeRange('Last 24 hours')}>24h</button><button className={timeRange === 'Last 7 days' ? 'active' : ''} onClick={() => setTimeRange('Last 7 days')}>7d</button><button className={timeRange === 'Last 30 days' ? 'active' : ''} onClick={() => setTimeRange('Last 30 days')}>30d</button></div></div>
              <div className="chart-area"><div className="chart-grid"><span>3</span><span>2</span><span>1</span><span>0</span></div><div className="chart-bars">{[1, 0, 2, 0, 1, 1, 3, 1, 1, 1].map((height, index) => <div className="bar-slot" key={index}><i className={index % 3 === 1 ? 'cme-bar' : index === 5 ? 'storm-bar' : 'flare-bar'} style={{ height: `${height * 35}px` }} />{height > 0 && <b style={{ bottom: `${height * 35 + 8}px` }}>{height}</b>}<small>{['00–04', '', '08–12', '', '16–20', '', '20–24', '', '', ''][index]}</small></div>)}</div></div>
              <div className="chart-legend"><span><i className="flare-dot" /> Solar flares</span><span><i className="cme-dot" /> CMEs</span><span><i className="storm-dot" /> Geomagnetic storms</span></div>
            </div>
            <aside className="awareness-panel"><h2>What this means for you</h2><span className="awareness-tag">{simulationLevel.toUpperCase()} AWARENESS</span><strong>Activity is {simulationLevel.toLowerCase()} typical levels.</strong><p>Most people can continue their day as usual. Some technology may experience disruption.</p><div className="impact-line"><b>01</b><div><strong>Shortwave radio</strong><span>Brief interruptions are possible on Earth's sunlit side during stronger flares.</span></div></div><div className="impact-line"><b>02</b><div><strong>Satellite & GPS services</strong><span>An Earth-directed CME may affect signals. Arrival and impact remain uncertain.</span></div></div><button onClick={() => setActiveNav('Live activity')}>Understand the risk levels <Icon name="arrow" size={13} /></button></aside>
          </section>

          <section className="events-table-panel panel">
            <div className="panel-heading"><div><h2>Recent events</h2><p>Live records from the current monitoring window</p></div><button className="more-button">Explore all events <Icon name="arrow" size={13} /></button></div>
            <div className="filter-row"><div className="filter-tabs">{(['All events', 'Solar flare', 'CME', 'Geomagnetic'] as const).map((filter) => <button key={filter} className={activeFilter === filter ? 'filter active' : 'filter'} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div><label className="search-box"><Icon name="search" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events" /></label></div>
            <div className="table-scroll"><table><thead><tr><th>EVENT TYPE</th><th>TIME · UTC</th><th>MAGNITUDE / SPEED</th><th>PLAIN-LANGUAGE SUMMARY</th><th>DETAILS</th></tr></thead><tbody>{filteredEvents.slice(0, 6).map((event) => <tr key={event.id}><td><span className={`table-type ${event.icon}`}>{event.type}</span></td><td>{event.time.replace('Today, ', '').replace('Yesterday, ', '')}</td><td>{event.type === 'Solar flare' ? event.title.split(' ')[0] : event.type === 'CME' ? '812 km/s' : `Kp ${kp}`}</td><td>{event.detail}. {event.severity === 'High' ? 'Potential impact remains uncertain.' : 'Limited effects expected.'}</td><td><button className="view-event">View <Icon name="arrow" size={12} /></button></td></tr>)}</tbody></table>{filteredEvents.length === 0 && <div className="empty-state">No events match your search.</div>}</div>
          </section>

          </>}
          <footer className="footer"><span>NASA DONKI · NOAA SWPC{snapshot?.apodTitle ? ' · APOD' : ''}</span><span className="footer-status"><i /> {snapshot?.sources.nasa && snapshot.sources.noaa ? 'Live feeds connected' : 'Fallback mode'}</span><span>Simulation only · not an official forecast <Icon name="info" size={13} /></span></footer>
        </div>
      </main>
    </div>
  )
}

export default App
