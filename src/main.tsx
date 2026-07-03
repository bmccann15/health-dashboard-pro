import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Apple, BarChart3, CalendarDays, Download, Flame, HeartPulse, Plus, Scale, Settings, Star, Target, Upload } from 'lucide-react';
import './styles.css';

type Meal = {
  id: string;
  date: string;
  name: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
};

type ActivityEntry = { id: string; date: string; type: string; calories: number; notes?: string };
type WeightEntry = { id: string; date: string; weight: number };
type FavoriteMeal = Omit<Meal, 'id' | 'date'> & { id: string };
type SettingsData = { startWeight: number; currentGoalWeight: number; dailyTarget: number; deficitPerDay: number };
type AppData = { meals: Meal[]; activities: ActivityEntry[]; weights: WeightEntry[]; favorites: FavoriteMeal[]; settings: SettingsData };

type Tab = 'today' | 'add' | 'trends' | 'settings';

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const STORAGE_KEY = 'health-dashboard-pro-v1';

const defaultData: AppData = {
  meals: [],
  activities: [],
  weights: [],
  favorites: [],
  settings: { startWeight: 245, currentGoalWeight: 220, dailyTarget: 2100, deficitPerDay: 750 },
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData;
  } catch {
    return defaultData;
  }
}

function saveData(data: AppData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
const sum = (items: number[]) => items.reduce((a, b) => a + b, 0);
const fmt = (n: number) => Math.round(n).toLocaleString();
const avg = (nums: number[]) => nums.length ? sum(nums) / nums.length : 0;
const daysAgo = (d: number) => { const date = new Date(); date.setDate(date.getDate() - d); return date.toISOString().slice(0, 10); };

function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [tab, setTab] = useState<Tab>('today');
  const [selectedDate, setSelectedDate] = useState(today());

  const update = (next: AppData) => { setData(next); saveData(next); };
  const dayMeals = data.meals.filter(m => m.date === selectedDate);
  const dayActivities = data.activities.filter(a => a.date === selectedDate);
  const dayWeight = data.weights.filter(w => w.date === selectedDate).sort((a,b) => a.id.localeCompare(b.id)).at(-1);
  const latestWeight = [...data.weights].sort((a,b) => a.date.localeCompare(b.date)).at(-1)?.weight ?? data.settings.startWeight;
  const nutrition = useMemo(() => ({
    calories: sum(dayMeals.map(m => m.calories)), protein: sum(dayMeals.map(m => m.protein)), carbs: sum(dayMeals.map(m => m.carbs)),
    fat: sum(dayMeals.map(m => m.fat)), fiber: sum(dayMeals.map(m => m.fiber)), sugar: sum(dayMeals.map(m => m.sugar)), activity: sum(dayActivities.map(a => a.calories))
  }), [dayMeals, dayActivities]);
  const projectedWeeklyLoss = (data.settings.deficitPerDay * 7) / 3500;
  const poundsToGoal = Math.max(0, latestWeight - data.settings.currentGoalWeight);
  const daysToGoal = projectedWeeklyLoss > 0 ? Math.ceil((poundsToGoal / projectedWeeklyLoss) * 7) : 0;
  const goalDate = daysToGoal ? daysAgo(-daysToGoal) : 'Goal reached';

  return <div className="app-shell">
    <header className="hero">
      <div>
        <p className="eyebrow">McCann Apps</p>
        <h1>Health Dashboard Pro</h1>
        <p className="subtle">Clean tracking. Useful trends. No guilt.</p>
      </div>
      <div className="app-icon"><HeartPulse size={34}/></div>
    </header>

    <main>
      {tab === 'today' && <Today data={data} update={update} selectedDate={selectedDate} setSelectedDate={setSelectedDate} nutrition={nutrition} dayMeals={dayMeals} dayActivities={dayActivities} dayWeight={dayWeight} latestWeight={latestWeight} projectedWeeklyLoss={projectedWeeklyLoss} goalDate={goalDate}/>}      
      {tab === 'add' && <Add data={data} update={update} selectedDate={selectedDate}/>}      
      {tab === 'trends' && <Trends data={data}/>}      
      {tab === 'settings' && <SettingsView data={data} update={update}/>}      
    </main>

    <nav className="bottom-nav">
      <NavButton active={tab==='today'} onClick={()=>setTab('today')} icon={<Flame/>} label="Today" />
      <NavButton active={tab==='add'} onClick={()=>setTab('add')} icon={<Plus/>} label="Add" />
      <NavButton active={tab==='trends'} onClick={()=>setTab('trends')} icon={<BarChart3/>} label="Trends" />
      <NavButton active={tab==='settings'} onClick={()=>setTab('settings')} icon={<Settings/>} label="Settings" />
    </nav>
  </div>;
}

function NavButton({active,onClick,icon,label}:{active:boolean;onClick:()=>void;icon:React.ReactNode;label:string}){
  return <button className={active?'nav active':'nav'} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function Today(props: any) {
  const { data, update, selectedDate, setSelectedDate, nutrition, dayMeals, dayActivities, dayWeight, latestWeight, projectedWeeklyLoss, goalDate } = props;
  const net = nutrition.calories - nutrition.activity;
  const remaining = data.settings.dailyTarget - net;
  return <section className="stack">
    <div className="date-row"><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} /><span className="chip">{remaining >= 0 ? `${fmt(remaining)} left` : `${fmt(Math.abs(remaining))} over`}</span></div>
    <div className="card primary-card">
      <div><p className="eyebrow">Daily net calories</p><h2>{fmt(net)}</h2><p className="subtle">{fmt(nutrition.calories)} eaten − {fmt(nutrition.activity)} activity</p></div>
      <div className="ring"><span>{fmt(data.settings.dailyTarget)}</span><small>target</small></div>
    </div>
    <div className="grid two">
      <Metric icon={<Scale/>} label="Latest weight" value={`${latestWeight} lb`} />
      <Metric icon={<Target/>} label="Weekly pace" value={`${projectedWeeklyLoss.toFixed(1)} lb`} />
      <Metric icon={<CalendarDays/>} label="Goal date" value={goalDate} />
      <Metric icon={<Apple/>} label="Protein" value={`${fmt(nutrition.protein)}g`} />
    </div>
    <div className="card"><h3>Nutrition</h3><div className="macro-grid">{['calories','protein','carbs','fat','fiber','sugar'].map(k => <div key={k}><span>{k}</span><strong>{k==='calories'?fmt(nutrition[k]):`${fmt(nutrition[k])}g`}</strong></div>)}</div></div>
    <div className="card"><h3>Meals</h3>{dayMeals.length ? dayMeals.map((m:Meal)=><Row key={m.id} title={`${m.mealType}: ${m.name}`} meta={`${fmt(m.calories)} cal • ${fmt(m.protein)}g protein`} onDelete={()=>update({...data, meals:data.meals.filter((x:Meal)=>x.id!==m.id)})}/>) : <Empty text="No meals yet. Add one fast from the Add tab."/>}</div>
    <div className="card"><h3>Activities</h3>{dayActivities.length ? dayActivities.map((a:ActivityEntry)=><Row key={a.id} title={a.type} meta={`${fmt(a.calories)} calories burned`} onDelete={()=>update({...data, activities:data.activities.filter((x:ActivityEntry)=>x.id!==a.id)})}/>) : <Empty text="No activity logged yet."/>}</div>
    <div className="card"><h3>Weight</h3>{dayWeight ? <Row title={`${dayWeight.weight} lb`} meta="Logged for this day" onDelete={()=>update({...data, weights:data.weights.filter((x:WeightEntry)=>x.id!==dayWeight.id)})}/> : <Empty text="No weight logged for this date."/>}</div>
  </section>
}

function Add({data, update, selectedDate}:{data:AppData; update:(d:AppData)=>void; selectedDate:string}) {
  const emptyMeal = { date:selectedDate, name:'', mealType:'Lunch' as Meal['mealType'], calories:0, protein:0, carbs:0, fat:0, fiber:0, sugar:0 };
  const [meal, setMeal] = useState(emptyMeal);
  const [activity, setActivity] = useState({ date:selectedDate, type:'', calories:0, notes:'' });
  const [weight, setWeight] = useState({ date:selectedDate, weight:0 });
  const addMeal = (saveFavorite=false) => {
    if (!meal.name || !meal.calories) return;
    const newMeal = { ...meal, id: uid() };
    const favorites = saveFavorite ? [...data.favorites, { id: uid(), name: meal.name, mealType: meal.mealType, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, fiber: meal.fiber, sugar: meal.sugar }] : data.favorites;
    update({ ...data, meals:[...data.meals, newMeal], favorites }); setMeal(emptyMeal);
  };
  return <section className="stack">
    <div className="card"><h3>Add meal</h3>
      <div className="form-grid"><input placeholder="Meal name" value={meal.name} onChange={e=>setMeal({...meal,name:e.target.value})}/><select value={meal.mealType} onChange={e=>setMeal({...meal,mealType:e.target.value as Meal['mealType']})}>{['Breakfast','Lunch','Dinner','Snack'].map(x=><option key={x}>{x}</option>)}</select><input type="date" value={meal.date} onChange={e=>setMeal({...meal,date:e.target.value})}/>{['calories','protein','carbs','fat','fiber','sugar'].map(k=><input key={k} type="number" placeholder={k} value={(meal as any)[k] || ''} onChange={e=>setMeal({...meal,[k]:Number(e.target.value)} as any)}/>)}</div>
      <div className="actions"><button onClick={()=>addMeal(false)}>Add meal</button><button className="secondary" onClick={()=>addMeal(true)}><Star size={16}/> Add + save favorite</button></div>
    </div>
    <div className="card"><h3>Use favorite meal</h3>{data.favorites.length ? data.favorites.map(f=><Row key={f.id} title={f.name} meta={`${f.calories} cal • ${f.protein}g protein`} onClick={()=>update({...data, meals:[...data.meals, {...f, id:uid(), date:selectedDate}]})} onDelete={()=>update({...data, favorites:data.favorites.filter(x=>x.id!==f.id)})}/>) : <Empty text="Favorites appear after you save a meal."/>}</div>
    <div className="card"><h3>Add activity</h3><div className="form-grid"><input placeholder="Activity type, e.g. hockey" value={activity.type} onChange={e=>setActivity({...activity,type:e.target.value})}/><input type="number" placeholder="Calories burned" value={activity.calories || ''} onChange={e=>setActivity({...activity,calories:Number(e.target.value)})}/><input type="date" value={activity.date} onChange={e=>setActivity({...activity,date:e.target.value})}/></div><button onClick={()=>{if(activity.type&&activity.calories){update({...data,activities:[...data.activities,{...activity,id:uid()}]});setActivity({date:selectedDate,type:'',calories:0,notes:''})}}}>Add activity</button></div>
    <div className="card"><h3>Log weight</h3><div className="form-grid"><input type="number" placeholder="Weight" value={weight.weight || ''} onChange={e=>setWeight({...weight,weight:Number(e.target.value)})}/><input type="date" value={weight.date} onChange={e=>setWeight({...weight,date:e.target.value})}/></div><button onClick={()=>{if(weight.weight){update({...data,weights:[...data.weights,{...weight,id:uid()}]});setWeight({date:selectedDate,weight:0})}}}>Log weight</button></div>
  </section>
}

function Trends({data}:{data:AppData}) {
  const weekDates = Array.from({length:7},(_,i)=>daysAgo(6-i));
  const monthDates = Array.from({length:30},(_,i)=>daysAgo(29-i));
  const dayCalories = (d:string)=>sum(data.meals.filter(m=>m.date===d).map(m=>m.calories));
  const dayProtein = (d:string)=>sum(data.meals.filter(m=>m.date===d).map(m=>m.protein));
  const dayActivity = (d:string)=>sum(data.activities.filter(a=>a.date===d).map(a=>a.calories));
  const latest = [...data.weights].sort((a,b)=>a.date.localeCompare(b.date));
  const firstMonth = latest.find(w=>w.date>=monthDates[0]);
  const lastWeight = latest.at(-1);
  return <section className="stack">
    <div className="grid two"><Metric icon={<Flame/>} label="7-day avg calories" value={fmt(avg(weekDates.map(dayCalories)))}/><Metric icon={<Apple/>} label="7-day avg protein" value={`${fmt(avg(weekDates.map(dayProtein)))}g`}/><Metric icon={<Activity/>} label="7-day avg activity" value={fmt(avg(weekDates.map(dayActivity)))}/><Metric icon={<Scale/>} label="30-day weight change" value={firstMonth&&lastWeight ? `${(lastWeight.weight-firstMonth.weight).toFixed(1)} lb` : '—'}/></div>
    <BarCard title="Last 7 days: calories" dates={weekDates} values={weekDates.map(dayCalories)} />
    <BarCard title="Last 7 days: activity calories" dates={weekDates} values={weekDates.map(dayActivity)} />
    <BarCard title="Last 30 days: calories" dates={monthDates} values={monthDates.map(dayCalories)} compact />
  </section>
}

function SettingsView({data, update}:{data:AppData; update:(d:AppData)=>void}) {
  const exportData = () => { const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`health-dashboard-pro-backup-${today()}.json`; a.click(); };
  const importData = (file?: File) => { if(!file) return; const reader = new FileReader(); reader.onload = () => { try { update(JSON.parse(String(reader.result))); } catch { alert('Could not import this file.'); } }; reader.readAsText(file); };
  return <section className="stack"><div className="card"><h3>Goals</h3><div className="form-grid">{[['startWeight','Start weight'],['currentGoalWeight','Goal weight'],['dailyTarget','Daily calorie target'],['deficitPerDay','Daily deficit estimate']].map(([k,label])=><label key={k}>{label}<input type="number" value={(data.settings as any)[k]} onChange={e=>update({...data,settings:{...data.settings,[k]:Number(e.target.value)}})}/></label>)}</div></div><div className="card"><h3>Backup</h3><p className="subtle">Your data is stored in this browser. Export a backup before clearing browser data or changing devices.</p><div className="actions"><button onClick={exportData}><Download size={16}/> Export JSON</button><label className="button secondary"><Upload size={16}/> Import JSON<input hidden type="file" accept="application/json" onChange={e=>importData(e.target.files?.[0])}/></label></div></div></section>
}

function Metric({icon,label,value}:{icon:React.ReactNode; label:string; value:string}) { return <div className="card metric"><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong></div>; }
function Empty({text}:{text:string}) { return <p className="empty">{text}</p>; }
function Row({title,meta,onDelete,onClick}:{title:string;meta:string;onDelete?:()=>void;onClick?:()=>void}) { return <div className="row" onClick={onClick}><div><strong>{title}</strong><span>{meta}</span></div>{onDelete&&<button className="ghost" onClick={(e)=>{e.stopPropagation();onDelete();}}>Delete</button>}</div>; }
function BarCard({title,dates,values,compact=false}:{title:string;dates:string[];values:number[];compact?:boolean}) { const max = Math.max(...values,1); return <div className="card"><h3>{title}</h3><div className={compact?'bars compact':'bars'}>{values.map((v,i)=><div key={dates[i]} className="bar-wrap"><div className="bar" style={{height:`${Math.max(4,(v/max)*100)}%`}}/><small>{compact?'':dates[i].slice(5)}</small></div>)}</div></div>; }

createRoot(document.getElementById('root')!).render(<App />);
