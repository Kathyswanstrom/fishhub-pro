"type": "module",
'use client';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Anchor, Camera, Compass, Fish, MapPin, PlayCircle, Radio, Share2, ShipWheel, Waves, Shell } from 'lucide-react';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { estimateHalibutWeight, estimateSalmonWeight, formatDateTimeLocal, processedYield, roundOne, shareMapUrl } from '@/lib/calculations';
import { tideDataForLocation } from '@/lib/noaa';
import { fetchWeatherSnapshot } from '@/lib/weather';
import type { CatchRecord, CrabPotRecord, PrivacyLevel, Species } from '@/lib/types';

const fishBaits = ['Herring', 'Salmon belly', 'Octopus', 'Squid', 'Cod', 'Glow jig', 'Scented bait', 'Artificial lure', 'Other'];
const salmonTypes = ['King / Chinook', 'Silver / Coho', 'Sockeye', 'Pink', 'Chum'];
const crabBaits = ['Salmon carcass', 'Fish scraps', 'Herring', 'Chicken', 'Squid', 'Razor clam', 'Other'];
const privacyOptions: PrivacyLevel[] = ['private', 'crew', 'approximate', 'public'];

type Trip = { id?: string; title: string; started_at: string; ended_at?: string | null; launch_location?: string | null; crew?: string | null; notes?: string | null };

type SmartSpot = {
  id?: string; name: string; species: Species; latitude?: number | null; longitude?: number | null; depth_ft?: number | null; best_tide_window?: string | null;
  best_bait?: string | null; confidence_score?: number | null; productivity_notes?: string | null; privacy_level?: PrivacyLevel;
};

const demoCatches: CatchRecord[] = [
  { id:'demo1', species:'halibut', length_inches:42, estimated_weight_lbs:35.6, estimated_yield_lbs:17.8, yield_percent:50, location_name:'Anchor Point Drift', depth_ft:185, caught_at:new Date().toISOString(), bait:'Herring', high_tide:'8:42 AM / 14.1 ft', low_tide:'2:18 PM / -1.2 ft', tide_station_name:'Demo NOAA Station', weather_summary:'Air 52°F, wind 8 mph, waves 1.1 m', privacy_level:'private' },
  { id:'demo2', species:'salmon', species_detail:'Silver / Coho', length_inches:29, estimated_weight_lbs:9.8, estimated_yield_lbs:5.9, yield_percent:60, location_name:'Silver Line', depth_ft:45, caught_at:new Date().toISOString(), bait:'Artificial lure', lure_color:'green glow', weather_summary:'Air 54°F, wind 5 mph', privacy_level:'crew' }
];
const demoCrab: CrabPotRecord[] = [
  { id:'pot1', pot_number:'Pot 1', location_name:'West Pot Line', depth_ft:165, bait:'Salmon carcass', dropped_at:new Date().toISOString(), keepers:8, shorts:14, females:2, soft_shell:1, soak_hours:18, bottom_type:'mud/sand', privacy_level:'private' }
];
const demoSpots: SmartSpot[] = [
  { id:'spot1', name:'Anchor Point Drift', species:'halibut', depth_ft:185, best_tide_window:'1 hr before low to 2 hrs after low', best_bait:'Herring / salmon belly', confidence_score:87, productivity_notes:'Strong historical halibut performance on outgoing tide.', privacy_level:'private' },
  { id:'spot2', name:'West Pot Line', species:'crab', depth_ft:165, best_tide_window:'Tide optional; prioritize soak time', best_bait:'Salmon carcass', confidence_score:91, productivity_notes:'Best keeper count with 14–20 hour soak.', privacy_level:'private' }
];

export default function FishHubPro() {
  const [active, setActive] = useState<'command'|'catch'|'crab'|'spots'|'videos'|'processing'>('command');
  const [catches, setCatches] = useState<CatchRecord[]>(demoCatches);
  const [pots, setPots] = useState<CrabPotRecord[]>(demoCrab);
  const [spots, setSpots] = useState<SmartSpot[]>(demoSpots);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [message, setMessage] = useState('Demo mode is showing sample data until Supabase is connected.');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    if (!hasSupabaseConfig) return;
    try {
      const [catchRes, potRes, spotRes, tripRes] = await Promise.all([
        supabase.from('catches').select('*').order('caught_at', { ascending: false }),
        supabase.from('crab_pots').select('*').order('dropped_at', { ascending: false }),
        supabase.from('smart_spots').select('*').order('confidence_score', { ascending: false }),
        supabase.from('trips').select('*').order('started_at', { ascending: false })
      ]);
      if (catchRes.error) throw catchRes.error; if (potRes.error) throw potRes.error; if (spotRes.error) throw spotRes.error;
      setCatches((catchRes.data || []) as CatchRecord[]); setPots((potRes.data || []) as CrabPotRecord[]); setSpots((spotRes.data || []) as SmartSpot[]); setTrips((tripRes.data || []) as Trip[]);
      setMessage('Live Supabase data loaded.');
    } catch (err:any) { setMessage(err.message || 'Unable to load live data. Demo data is still shown.'); }
  }

  const totals = useMemo(() => ({
    fishCount: catches.length,
    crabKeepers: pots.reduce((a,p)=>a+(p.keepers||0),0),
    totalWeight: roundOne(catches.reduce((a,c)=>a+(c.estimated_weight_lbs||0),0)),
    totalYield: roundOne(catches.reduce((a,c)=>a+(c.estimated_yield_lbs||0),0)),
    bestSpot: spots[0]?.name || 'No spots yet'
  }), [catches, pots, spots]);

  async function saveCatch(record: CatchRecord, photo?: File | null) {
    if (!hasSupabaseConfig) { setCatches([record, ...catches]); setMessage('Demo catch added. Connect Supabase to save permanently.'); return; }
    let photo_url: string | null = null;
    if (photo) photo_url = await uploadPhoto(photo);
    const { error } = await supabase.from('catches').insert({ ...record, photo_url });
    if (error) setMessage(error.message); else { setMessage('Catch saved.'); await loadData(); }
  }

  async function saveCrabPot(record: CrabPotRecord, photo?: File | null) {
    if (!hasSupabaseConfig) { setPots([record, ...pots]); setMessage('Demo crab pot added. Connect Supabase to save permanently.'); return; }
    let photo_url: string | null = null;
    if (photo) photo_url = await uploadPhoto(photo);
    const { error } = await supabase.from('crab_pots').insert({ ...record, photo_url });
    if (error) setMessage(error.message); else { setMessage('Crab pot saved.'); await loadData(); }
  }

  async function uploadPhoto(file: File) {
    const fileName = `${Date.now()}-${file.name.replaceAll(' ', '-')}`;
    const { error } = await supabase.storage.from('fishhub-photos').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('fishhub-photos').getPublicUrl(fileName).data.publicUrl;
  }

  function getDeviceLocation(callback: (lat:number,lng:number)=>void) {
    if (!navigator.geolocation) { setMessage('Device GPS is not available.'); return; }
    navigator.geolocation.getCurrentPosition(pos => callback(pos.coords.latitude, pos.coords.longitude), () => setMessage('Could not get GPS location.'));
  }

  return (
    <main className="min-h-screen bg-ocean text-slate-100">
      <header className="border-b border-white/10 bg-ocean/90 p-4 backdrop-blur md:p-6">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Image src="/fishhub-logo.png" alt="FishHub.pro logo" width={78} height={78} className="rounded-2xl" />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[.3em] text-gold">FishHub.pro</p>
            <h1 className="text-2xl font-black md:text-4xl">F.I.S.H. Command Center</h1>
            <p className="text-sm text-slate-300">Fishing Intelligence Storage Hub · Marine map-first design · Fish Smarter.</p>
          </div>
          <div className="hidden rounded-2xl border border-sonar/40 bg-sonar/10 px-4 py-3 text-sm md:block"><Radio className="mr-2 inline" size={16}/> {message}</div>
        </div>
      </header>

      <nav className="mx-auto grid max-w-7xl grid-cols-3 gap-2 p-3 md:grid-cols-6">
        <Tab id="command" active={active} setActive={setActive} icon={<Compass size={18}/>} label="Command" />
        <Tab id="catch" active={active} setActive={setActive} icon={<Fish size={18}/>} label="Catches" />
        <Tab id="crab" active={active} setActive={setActive} icon={<Shell size={18}/>} label="Crab" />
        <Tab id="spots" active={active} setActive={setActive} icon={<MapPin size={18}/>} label="Smart Spots" />
        <Tab id="videos" active={active} setActive={setActive} icon={<PlayCircle size={18}/>} label="Videos" />
        <Tab id="processing" active={active} setActive={setActive} icon={<Anchor size={18}/>} label="Processing" />
      </nav>

      <section className="mx-auto max-w-7xl p-3 pb-10">
        {active === 'command' && <CommandCenter totals={totals} catches={catches} pots={pots} spots={spots} />}
        {active === 'catch' && <CatchForm onSave={saveCatch} getDeviceLocation={getDeviceLocation} setMessage={setMessage} catches={catches} />}
        {active === 'crab' && <CrabForm onSave={saveCrabPot} getDeviceLocation={getDeviceLocation} pots={pots} />}
        {active === 'spots' && <SmartSpots spots={spots} catches={catches} pots={pots} />}
        {active === 'videos' && <InstructionVideos />}
        {active === 'processing' && <Processing catches={catches} pots={pots} />}
      </section>
    </main>
  );
}

function Tab({ id, active, setActive, icon, label }: any) {
  return <button onClick={()=>setActive(id)} className={`rounded-2xl px-3 py-3 text-sm font-bold ${active===id?'bg-gold text-ocean':'bg-white/10 text-slate-200 hover:bg-white/15'}`}>{icon}<span className="ml-2 align-middle">{label}</span></button>;
}

function CommandCenter({ totals, catches, pots, spots }: any) {
  return <div className="grid gap-4 lg:grid-cols-[1.5fr_.8fr]">
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-steel shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 p-4"><h2 className="text-xl font-black"><ShipWheel className="mr-2 inline"/>Marine Intelligence Map</h2><span className="text-xs text-slate-300">NOAA/Map layer placeholder</span></div>
      <div className="map-grid relative h-[560px]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ocean/70" />
        {spots.map((s:any, i:number)=><MapMarker key={s.id||i} left={18+i*24} top={30+i*14} label={s.name} score={s.confidence_score}/>) }
        {pots.map((p:any, i:number)=><MapMarker key={p.id||i} left={62+i*7} top={56-i*9} label={`🦀 ${p.pot_number}`} score={p.keepers}/>) }
        <div className="absolute bottom-4 left-4 rounded-2xl border border-sonar/40 bg-ocean/80 p-4 backdrop-blur"><p className="font-bold text-sonar">Smart Layer Active</p><p className="text-sm text-slate-300">Hot spots · crab lines · tide stations · drift replay ready</p></div>
      </div>
    </div>
    <aside className="space-y-4">
      <div className="grid grid-cols-2 gap-3"><Stat label="Fish" value={totals.fishCount}/><Stat label="Crab Keepers" value={totals.crabKeepers}/><Stat label="Weight" value={`${totals.totalWeight} lbs`}/><Stat label="Yield" value={`${totals.totalYield} lbs`}/></div>
      <Panel title="Suggested Spots"><p className="text-2xl font-black text-gold">{totals.bestSpot}</p><p className="mt-2 text-sm text-slate-300">Based on saved history, confidence scoring, tide windows, bait and depth patterns.</p>{spots.map((s:any)=><div key={s.id} className="mt-3 rounded-2xl bg-white/5 p-3"><b>{s.name}</b><p className="text-sm text-slate-300">{s.species} · {s.depth_ft || '-'} ft · {s.confidence_score || 0}% confidence</p></div>)}</Panel>
      <Panel title="Quick Actions"><div className="grid gap-2 text-sm"><button className="rounded-xl bg-sonar/20 p-3 text-left">Start Trip</button><button className="rounded-xl bg-sonar/20 p-3 text-left">Add Catch</button><button className="rounded-xl bg-sonar/20 p-3 text-left">Drop Crab Pot</button><button className="rounded-xl bg-sonar/20 p-3 text-left">Replay Trip</button></div></Panel>
    </aside>
  </div>
}
function MapMarker({ left, top, label, score }: any) { return <div className="absolute" style={{left:`${left}%`, top:`${top}%`}}><div className="h-5 w-5 rounded-full border-2 border-gold bg-sonar shadow-lg shadow-sonar/40"/><div className="mt-1 rounded-xl bg-ocean/85 px-3 py-2 text-xs"><b>{label}</b><br/>{score ? `${score} score` : 'mark'}</div></div> }
function Stat({label,value}:any){return <div className="rounded-3xl border border-white/10 bg-white/10 p-4"><p className="text-xs uppercase tracking-widest text-slate-400">{label}</p><p className="text-2xl font-black">{value}</p></div>}
function Panel({title, children}:any){return <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><h3 className="mb-3 text-lg font-black">{title}</h3>{children}</div>}

function CatchForm({ onSave, getDeviceLocation, setMessage, catches }: any) {
  const [species,setSpecies]=useState<Species>('halibut'); const [speciesDetail,setSpeciesDetail]=useState(''); const [length,setLength]=useState(''); const [girth,setGirth]=useState(''); const [yieldPct,setYieldPct]=useState('50');
  const [location,setLocation]=useState(''); const [lat,setLat]=useState(''); const [lng,setLng]=useState(''); const [depth,setDepth]=useState(''); const [caughtAt,setCaughtAt]=useState(formatDateTimeLocal());
  const [bait,setBait]=useState('Herring'); const [lureColor,setLureColor]=useState(''); const [highTide,setHighTide]=useState(''); const [lowTide,setLowTide]=useState(''); const [station,setStation]=useState(''); const [weather,setWeather]=useState(''); const [notes,setNotes]=useState(''); const [privacy,setPrivacy]=useState<PrivacyLevel>('private'); const [photo,setPhoto]=useState<File|null>(null); const [busy,setBusy]=useState(false);
  const estWeight = species==='halibut'?estimateHalibutWeight(Number(length)):estimateSalmonWeight(Number(length), Number(girth)); const estYield = processedYield(estWeight, Number(yieldPct));
  async function autoFill() { const la=Number(lat), lo=Number(lng); if(!la||!lo){setMessage('Add GPS first.'); return;} setBusy(true); try{ const [tide,wx]= await Promise.all([tideDataForLocation(la,lo,caughtAt), fetchWeatherSnapshot(la,lo)]); if(tide){setHighTide(tide.highTide); setLowTide(tide.lowTide); setStation(tide.stationName);} setWeather(wx.summary); } catch(e:any){setMessage(e.message)} finally{setBusy(false);} }
  function submit(e:React.FormEvent){ e.preventDefault(); onSave({species, species_detail:speciesDetail, length_inches:Number(length), girth_inches:girth?Number(girth):null, estimated_weight_lbs:estWeight, estimated_yield_lbs:estYield, yield_percent:Number(yieldPct), location_name:location, latitude:lat?Number(lat):null, longitude:lng?Number(lng):null, depth_ft:depth?Number(depth):null, caught_at:new Date(caughtAt).toISOString(), bait, lure_color:lureColor, tide_station_name:station, high_tide:highTide, low_tide:lowTide, weather_summary:weather, captain_notes:notes, privacy_level:privacy}, photo); }
  return <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/10 p-5"><h2 className="mb-4 text-2xl font-black">Add Fish Catch</h2><div className="grid gap-3 md:grid-cols-2"><Select label="Species" value={species} setValue={setSpecies} options={['halibut','salmon','other']}/>{species==='salmon'&&<Select label="Salmon type" value={speciesDetail} setValue={setSpeciesDetail} options={salmonTypes}/>}<Input label="Length inches" value={length} setValue={setLength} type="number"/><Input label="Girth inches optional" value={girth} setValue={setGirth} type="number"/><Input label="Location name" value={location} setValue={setLocation}/><Input label="Depth ft" value={depth} setValue={setDepth} type="number"/><Input label="Latitude" value={lat} setValue={setLat} type="number"/><Input label="Longitude" value={lng} setValue={setLng} type="number"/><Input label="Date/time" value={caughtAt} setValue={setCaughtAt} type="datetime-local"/><Select label="Bait" value={bait} setValue={setBait} options={fishBaits}/><Input label="Lure color" value={lureColor} setValue={setLureColor}/><Select label="Privacy" value={privacy} setValue={setPrivacy} options={privacyOptions}/><Input label="Yield %" value={yieldPct} setValue={setYieldPct} type="number"/><label className="text-sm font-bold">Photo<input className="mt-1 w-full rounded-xl bg-white p-3 text-slate-900" type="file" accept="image/*" onChange={(e)=>setPhoto(e.target.files?.[0]||null)}/></label></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="rounded-xl bg-sonar px-4 py-3 font-black text-ocean" onClick={()=>getDeviceLocation((a:number,b:number)=>{setLat(String(a));setLng(String(b));})}>Use GPS</button><button type="button" disabled={busy} className="rounded-xl bg-gold px-4 py-3 font-black text-ocean" onClick={autoFill}>{busy?'Pulling...':'Pull Tide + Weather'}</button></div><div className="mt-4 rounded-2xl bg-ocean/60 p-4"><b>Estimated:</b> {estWeight} lbs whole · {estYield} lbs processed</div><Input label="NOAA Tide Station" value={station} setValue={setStation}/><Input label="High Tide" value={highTide} setValue={setHighTide}/><Input label="Low Tide" value={lowTide} setValue={setLowTide}/><Input label="Weather / Marine" value={weather} setValue={setWeather}/><Textarea label="Captain’s Log" value={notes} setValue={setNotes}/><button className="mt-4 w-full rounded-2xl bg-gold p-4 font-black text-ocean">Save Catch</button></form><DataTable title="Fish Tally" rows={catches}/></div>
}

function CrabForm({ onSave, getDeviceLocation, pots }: any) {
  const [pot,setPot]=useState('Pot 1'),[location,setLocation]=useState(''),[lat,setLat]=useState(''),[lng,setLng]=useState(''),[depth,setDepth]=useState(''),[bait,setBait]=useState('Salmon carcass'),[dropped,setDropped]=useState(formatDateTimeLocal()),[pulled,setPulled]=useState(''),[keepers,setKeepers]=useState(''),[shorts,setShorts]=useState(''),[females,setFemales]=useState(''),[soft,setSoft]=useState(''),[bottom,setBottom]=useState('mud/sand'),[notes,setNotes]=useState(''),[privacy,setPrivacy]=useState<PrivacyLevel>('private'),[photo,setPhoto]=useState<File|null>(null);
  const soak = pulled ? roundOne((new Date(pulled).getTime()-new Date(dropped).getTime())/36e5) : null;
  function submit(e:React.FormEvent){ e.preventDefault(); onSave({pot_number:pot, location_name:location, latitude:lat?Number(lat):null, longitude:lng?Number(lng):null, depth_ft:depth?Number(depth):null, bait, dropped_at:new Date(dropped).toISOString(), pulled_at:pulled?new Date(pulled).toISOString():null, soak_hours:soak, keepers:Number(keepers||0), shorts:Number(shorts||0), females:Number(females||0), soft_shell:Number(soft||0), bottom_type:bottom, notes, privacy_level:privacy}, photo); }
  return <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/10 p-5"><h2 className="mb-4 text-2xl font-black">Crab Pot Tracker</h2><div className="grid gap-3 md:grid-cols-2"><Input label="Pot number" value={pot} setValue={setPot}/><Input label="Location" value={location} setValue={setLocation}/><Input label="Latitude" value={lat} setValue={setLat} type="number"/><Input label="Longitude" value={lng} setValue={setLng} type="number"/><Input label="Depth ft" value={depth} setValue={setDepth} type="number"/><Select label="Bait" value={bait} setValue={setBait} options={crabBaits}/><Input label="Dropped" value={dropped} setValue={setDropped} type="datetime-local"/><Input label="Pulled" value={pulled} setValue={setPulled} type="datetime-local"/><Input label="Keepers" value={keepers} setValue={setKeepers} type="number"/><Input label="Shorts" value={shorts} setValue={setShorts} type="number"/><Input label="Females" value={females} setValue={setFemales} type="number"/><Input label="Soft shell" value={soft} setValue={setSoft} type="number"/><Input label="Bottom type" value={bottom} setValue={setBottom}/><Select label="Privacy" value={privacy} setValue={setPrivacy} options={privacyOptions}/><label className="text-sm font-bold">Photo<input className="mt-1 w-full rounded-xl bg-white p-3 text-slate-900" type="file" accept="image/*" onChange={(e)=>setPhoto(e.target.files?.[0]||null)}/></label></div><button type="button" className="mt-3 rounded-xl bg-sonar px-4 py-3 font-black text-ocean" onClick={()=>getDeviceLocation((a:number,b:number)=>{setLat(String(a));setLng(String(b));})}>Use GPS</button><div className="mt-4 rounded-2xl bg-ocean/60 p-4"><b>Soak Time:</b> {soak ?? 'not pulled yet'} hours</div><Textarea label="Crab notes" value={notes} setValue={setNotes}/><button className="mt-4 w-full rounded-2xl bg-gold p-4 font-black text-ocean">Save Crab Pot</button></form><CrabTally pots={pots}/></div>
}
function CrabTally({pots}:any){ const totals = pots.reduce((a:any,p:any)=>({keepers:a.keepers+(p.keepers||0),shorts:a.shorts+(p.shorts||0),females:a.females+(p.females||0),soft:a.soft+(p.soft_shell||0)}),{keepers:0,shorts:0,females:0,soft:0}); return <Panel title="Crab Tally"><div className="grid grid-cols-4 gap-2"><Stat label="Keepers" value={totals.keepers}/><Stat label="Shorts" value={totals.shorts}/><Stat label="Females" value={totals.females}/><Stat label="Soft" value={totals.soft}/></div>{pots.map((p:any)=><div key={p.id} className="mt-3 rounded-2xl bg-white/5 p-3"><b>{p.pot_number}</b> · {p.location_name} · {p.depth_ft} ft<p className="text-sm text-slate-300">{p.keepers} keepers / {p.shorts} shorts · {p.soak_hours || '-'} hr soak · {p.bait}</p>{p.latitude&&<a className="text-sonar" href={shareMapUrl(p.latitude,p.longitude)} target="_blank"><Share2 className="inline" size={14}/> Share GPS</a>}</div>)}</Panel>}
function SmartSpots({spots}:any){return <div className="grid gap-4 md:grid-cols-2">{spots.map((s:any)=><Panel key={s.id} title={s.name}><p className="text-4xl font-black text-gold">{s.confidence_score || 0}%</p><p>{s.species} · {s.depth_ft || '-'} ft</p><p className="text-slate-300">Window: {s.best_tide_window}</p><p className="text-slate-300">Best bait: {s.best_bait}</p><p className="mt-3">{s.productivity_notes}</p></Panel>)}</div>}
function InstructionVideos(){ const vids=['How to use Smart Spots','Halibut drift tracking basics','Reading tide windows for halibut','Crab pot drop and retrieval workflow','Salmon lure color tracking','How to protect secret GPS spots']; return <div className="grid gap-4 md:grid-cols-3">{vids.map(v=><div key={v} className="rounded-3xl border border-white/10 bg-white/10 p-5"><div className="mb-4 flex h-36 items-center justify-center rounded-2xl bg-ocean/70"><PlayCircle size={54} className="text-gold"/></div><h3 className="font-black">{v}</h3><p className="text-sm text-slate-300">Placeholder for short instructional videos. Add hosted video URLs later.</p></div>)}</div>}
function Processing({catches,pots}:any){return <div className="grid gap-4 md:grid-cols-3"><Stat label="Processed Fish Yield" value={`${roundOne(catches.reduce((a:any,c:any)=>a+(c.estimated_yield_lbs||0),0))} lbs`}/><Stat label="Crab Keeper Count" value={pots.reduce((a:any,p:any)=>a+(p.keepers||0),0)}/><Stat label="Freezer Inventory" value="Coming next"/><Panel title="Processing Intelligence"><p>Track vacuum bags, fillets, cheeks, crab meat yield, freezer dates, and use-by reminders here.</p></Panel></div>}
function DataTable({title, rows}:any){return <Panel title={title}><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="text-slate-400"><th>Species</th><th>Location</th><th>Length</th><th>Weight</th><th>Yield</th><th>Bait</th><th>Share</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id} className="border-t border-white/10"><td className="py-2">{r.species}</td><td>{r.location_name}</td><td>{r.length_inches || '-'} in</td><td>{r.estimated_weight_lbs || '-'} lbs</td><td>{r.estimated_yield_lbs || '-'} lbs</td><td>{r.bait || '-'}</td><td>{r.latitude?<a className="text-sonar" target="_blank" href={shareMapUrl(r.latitude,r.longitude)}>GPS</a>:'-'}</td></tr>)}</tbody></table></div></Panel>}
function Input({label,value,setValue,type='text'}:any){return <label className="text-sm font-bold">{label}<input className="mt-1 w-full rounded-xl border border-white/20 bg-white p-3 text-slate-900" type={type} value={value} onChange={(e)=>setValue(e.target.value)}/></label>}
function Select({label,value,setValue,options}:any){return <label className="text-sm font-bold">{label}<select className="mt-1 w-full rounded-xl border border-white/20 bg-white p-3 text-slate-900" value={value} onChange={(e)=>setValue(e.target.value)}>{options.map((o:string)=><option key={o} value={o}>{o}</option>)}</select></label>}
function Textarea({label,value,setValue}:any){return <label className="mt-3 block text-sm font-bold">{label}<textarea className="mt-1 w-full rounded-xl border border-white/20 bg-white p-3 text-slate-900" value={value} onChange={(e)=>setValue(e.target.value)}/></label>}
