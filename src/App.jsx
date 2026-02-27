import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const HABIT_COLORS = [
  { bg: "#ff8c42", light: "#fff0e6", mid: "#ffd4b0", check: "#cc5500" },
  { bg: "#e06b3a", light: "#ffeee6", mid: "#ffccb3", check: "#a33d1a" },
  { bg: "#f4a261", light: "#fff5ea", mid: "#ffe0b8", check: "#b85e18" },
  { bg: "#e76f51", light: "#ffece8", mid: "#ffc8ba", check: "#a83520" },
  { bg: "#d4845a", light: "#ffeee5", mid: "#ffd0b5", check: "#8a4220" },
  { bg: "#c87941", light: "#ffeedd", mid: "#ffd4a0", check: "#7a4010" },
];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }

function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#fdf8f3", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lora',Georgia,serif", padding:"20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{ textAlign:"center", padding:"48px 32px", background:"#fff", borderRadius:20, border:"1.5px solid #f0dece", boxShadow:"0 8px 40px rgba(200,100,30,0.1)", maxWidth:400, width:"100%" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🌱</div>
        <h1 style={{ fontFamily:"'Lora',serif", fontSize:28, fontWeight:700, color:"#2c1a0e", marginBottom:8 }}>My Habits</h1>
        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:"#b08060", marginBottom:32 }}>Track your daily habits, one day at a time.</p>
        {error && <div style={{ background:"#fff0ee", border:"1px solid #ffc8ba", borderRadius:8, padding:"10px 14px", marginBottom:16, fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:"#a83520" }}>{error}</div>}
        <button onClick={signInWithGoogle} disabled={loading}
          style={{ width:"100%", padding:"14px 20px", borderRadius:10, border:"1.5px solid #e8d5c0", background:"#fff", cursor:loading?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:500, color:"#2c1a0e", transition:"all 0.15s", opacity:loading?0.7:1, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#ff8c42"}
          onMouseLeave={e=>e.currentTarget.style.borderColor="#e8d5c0"}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.7 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>
        <p style={{ marginTop:20, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"#c4a882" }}>Your data syncs across all your devices.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [habitIdx, setHabitIdx] = useState(0);
  const [newHabit, setNewHabit] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [slideDir, setSlideDir] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar"); // "calendar" | "today" | "all"

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); setAuthLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadData(); }, [session]);

  const loadData = async () => {
    setDataLoading(true);
    const userId = session.user.id;
    const [{ data: habitsData }, { data: completionsData }] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("completions").select("*").eq("user_id", userId),
    ]);
    setHabits(habitsData || []);
    const map = {};
    for (const c of (completionsData || [])) {
      if (!map[c.date]) map[c.date] = [];
      map[c.date].push(c.habit_id);
    }
    setCompletions(map);
    setDataLoading(false);
  };

  const addHabit = async () => {
    if (!newHabit.trim() || saving) return;
    setSaving(true);
    const { data, error } = await supabase.from("habits").insert({ user_id: session.user.id, name: newHabit.trim() }).select().single();
    if (!error && data) { const next = [...habits, data]; setHabits(next); setHabitIdx(next.length - 1); }
    setNewHabit(""); setShowAdd(false); setSaving(false);
  };

  const removeHabit = async (id) => {
    await supabase.from("habits").delete().eq("id", id);
    await supabase.from("completions").delete().eq("habit_id", id);
    const next = habits.filter(h => h.id !== id);
    setHabits(next);
    setHabitIdx(i => Math.min(i, Math.max(0, next.length - 1)));
    setCompletions(prev => { const upd = {}; for (const [k, v] of Object.entries(prev)) upd[k] = v.filter(hid => hid !== id); return upd; });
  };

  const toggle = async (day, habitId) => {
    const dateStr = `${viewDate.year}-${String(viewDate.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const cur = completions[dateStr] || [];
    const done = cur.includes(habitId);
    setCompletions(prev => { const updated = done ? cur.filter(id => id !== habitId) : [...cur, habitId]; return { ...prev, [dateStr]: updated }; });
    if (done) { await supabase.from("completions").delete().eq("user_id", session.user.id).eq("habit_id", habitId).eq("date", dateStr); }
    else { await supabase.from("completions").insert({ user_id: session.user.id, habit_id: habitId, date: dateStr }); }
  };

  const signOut = () => supabase.auth.signOut();

  const goToHabit = (dir) => {
    setSlideDir(dir);
    setTimeout(() => { setHabitIdx(i => (i + (dir === 'right' ? 1 : -1) + habits.length) % habits.length); setSelectedDay(null); setSlideDir(null); }, 180);
  };

  const prevMonth = () => { setViewDate(({year,month}) => month===0?{year:year-1,month:11}:{year,month:month-1}); setSelectedDay(null); };
  const nextMonth = () => { setViewDate(({year,month}) => month===11?{year:year+1,month:0}:{year,month:month+1}); setSelectedDay(null); };

  const { year, month } = viewDate;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const dateKey = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isToday = (d) => d===today.getDate() && month===today.getMonth() && year===today.getFullYear();
  const isFuture = (d) => new Date(year, month, d) > today;
  const isDone = (habitId, day) => (completions[dateKey(day)] || []).includes(habitId);

  const getStreak = (habitId) => {
    let streak = 0, d = new Date(today);
    while (true) {
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if ((completions[k]||[]).includes(habitId)) { streak++; d.setDate(d.getDate()-1); } else break;
    }
    return streak;
  };

  const getMonthPct = (habitId) => {
    let done=0, total=0;
    for (let d=1; d<=daysInMonth; d++) if (!isFuture(d)) { total++; if (isDone(habitId,d)) done++; }
    return total ? Math.round((done/total)*100) : 0;
  };

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  const activeHabit = habits[habitIdx] || null;
  const activeColor = HABIT_COLORS[habitIdx % HABIT_COLORS.length];

  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:"#fdf8f3", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color:"#b08060" }}>Loading…</div>
    </div>
  );

  if (!session) return <AuthScreen />;

  return (
    <div style={{ minHeight:"100vh", background:"#fdf8f3", color:"#2c1a0e", fontFamily:"'Lora',Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#fdf8f3;}
        .day-cell{aspect-ratio:1;border-radius:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:all 0.18s ease;position:relative;user-select:none;}
        .day-cell:hover:not(.future){transform:scale(1.08);box-shadow:0 4px 14px rgba(200,100,30,0.2);z-index:2;}
        .day-cell.selected{box-shadow:0 0 0 2.5px #ff8c42,0 4px 14px rgba(200,100,30,0.2);}
        .today-ring{position:absolute;inset:-2px;border-radius:10px;border:2px solid;pointer-events:none;}
        input{background:#fff;border:1.5px solid #e8d5c0;color:#2c1a0e;padding:10px 14px;border-radius:8px;font-family:'IBM Plex Mono',monospace;font-size:13px;outline:none;width:100%;transition:border-color 0.15s;}
        input:focus{border-color:#ff8c42;box-shadow:0 0 0 3px rgba(255,140,66,0.12);}
        input::placeholder{color:#c4a882;}
        .btn-primary{background:#ff8c42;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-family:'IBM Plex Mono',monospace;font-weight:500;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
        .btn-primary:hover{background:#e6751f;}
        .btn-ghost{background:transparent;color:#b08060;border:1.5px solid #e8d5c0;padding:7px 16px;border-radius:8px;font-size:12px;font-family:'IBM Plex Mono',monospace;cursor:pointer;transition:all 0.15s;}
        .btn-ghost:hover{color:#cc5500;border-color:#ff8c42;background:#fff8f2;}
        .nav-arrow{background:none;border:none;cursor:pointer;font-size:24px;color:#c4a882;transition:all 0.15s;padding:4px 10px;line-height:1;font-family:'IBM Plex Mono',monospace;}
        .nav-arrow:hover{color:#ff8c42;}
        .nav-arrow:disabled{opacity:0.2;cursor:default;}
        .habit-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;cursor:pointer;transition:background 0.15s;}
        .habit-row:hover{background:#fff0e6;}
        .bottom-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px 4px;border:none;background:none;cursor:pointer;transition:color 0.15s;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#c4a882;}
        .bottom-tab.active{color:#ff8c42;}
        @keyframes slideLeft{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .slide-left{animation:slideLeft 0.22s ease;}
        .slide-right{animation:slideRight 0.22s ease;}
        .fade-in{animation:fadeIn 0.22s ease;}
        .dot-indicator{width:7px;height:7px;border-radius:50%;transition:all 0.2s;cursor:pointer;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#e8d5c0;border-radius:3px;}

        /* Desktop layout */
        .main-grid{display:grid;grid-template-columns:1fr 270px;gap:28px;align-items:start;}
        .bottom-nav{display:none;}
        .desktop-sidebar{display:flex;flex-direction:column;gap:20px;}

        /* Mobile layout */
        @media (max-width: 700px) {
          .main-grid{display:block;}
          .bottom-nav{display:flex;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #f0dece;z-index:100;padding-bottom:env(safe-area-inset-bottom);}
          .desktop-sidebar{display:none;}
          .mobile-panel{display:block;}
          body{padding-bottom:70px;}
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #f0dece", background:"#fff", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, position:"sticky", top:0, zIndex:50 }}>
        <span style={{ fontFamily:"'Lora',serif", fontSize:16, fontWeight:700, color:"#2c1a0e" }}>🌱 My Habits</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"#b08060", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {session.user.user_metadata?.full_name || session.user.email}
          </span>
          <button className="btn-ghost" style={{ fontSize:11, padding:"5px 10px" }} onClick={signOut}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 16px 80px" }}>

        {/* Habit title + nav */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:0, flex:1, minWidth:0 }}>
            <button className="nav-arrow" disabled={habits.length<=1} onClick={() => goToHabit('left')}>‹</button>
            <div style={{ flex:1, textAlign:"center", minWidth:0 }}>
              {dataLoading ? (
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color:"#c4a882" }}>Loading…</span>
              ) : habits.length === 0 ? (
                <span style={{ fontFamily:"'Lora',serif", fontSize:"clamp(20px,5vw,34px)", fontWeight:700, color:"#d4b89a" }}>No habits yet</span>
              ) : (
                <h1 key={activeHabit?.id} className={slideDir==='right'?'slide-left':slideDir==='left'?'slide-right':''}
                  style={{ fontFamily:"'Lora',serif", fontSize:"clamp(20px,5vw,38px)", fontWeight:700, color:"#2c1a0e", lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {activeHabit?.name}
                </h1>
              )}
              {habits.length > 1 && (
                <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:8 }}>
                  {habits.map((h, i) => (
                    <div key={h.id} className="dot-indicator"
                      onClick={() => { const dir=i>habitIdx?'right':'left'; setSlideDir(dir); setTimeout(()=>{setHabitIdx(i);setSelectedDay(null);setSlideDir(null);},180); }}
                      style={{ background: i===habitIdx ? activeColor.bg : "#e8d5c0", transform: i===habitIdx?"scale(1.3)":"scale(1)" }}
                    />
                  ))}
                </div>
              )}
            </div>
            <button className="nav-arrow" disabled={habits.length<=1} onClick={() => goToHabit('right')}>›</button>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            {activeHabit && <button className="btn-ghost" style={{ fontSize:11, padding:"6px 10px", color:"#e0a0a0", borderColor:"#f0d0d0" }} onClick={() => removeHabit(activeHabit.id)}>Remove</button>}
            <button className="btn-primary" style={{ padding:"8px 14px", fontSize:12 }} onClick={() => setShowAdd(v=>!v)}>+ New</button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="fade-in" style={{ background:"#fff", border:"1.5px solid #e8d5c0", borderRadius:12, padding:16, marginBottom:24, display:"flex", gap:8, alignItems:"center", boxShadow:"0 4px 20px rgba(200,100,30,0.08)" }}>
            <input value={newHabit} onChange={e=>setNewHabit(e.target.value)} placeholder="Name your habit…" onKeyDown={e=>e.key==="Enter"&&addHabit()} autoFocus />
            <button className="btn-primary" onClick={addHabit} disabled={saving} style={{ padding:"10px 14px", fontSize:12 }}>{saving?"…":"Add"}</button>
            <button className="btn-ghost" style={{ padding:"8px 10px", fontSize:11 }} onClick={()=>{setShowAdd(false);setNewHabit("");}}>✕</button>
          </div>
        )}

        {habits.length === 0 && !dataLoading ? (
          <div style={{ textAlign:"center", padding:"60px 24px", background:"#fff", borderRadius:16, border:"1.5px dashed #e8d5c0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🌱</div>
            <p style={{ fontFamily:"'Lora',serif", fontSize:18, color:"#b08060", marginBottom:6 }}>Start your first habit</p>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:"#c4a882" }}>Tap "+ New" above to begin</p>
          </div>
        ) : activeHabit && (
          <div className="main-grid">

            {/* Calendar — always shown on desktop, shown on mobile when calendar tab active */}
            <div key={activeHabit.id + month} className={slideDir==='right'?'slide-left':slideDir==='left'?'slide-right':''}
              style={{ background:"#fff", borderRadius:16, border:"1.5px solid #f0dece", padding:"20px 16px", boxShadow:"0 4px 24px rgba(200,100,30,0.07)", display: activeTab === "calendar" ? "block" : "none" }}
              id="calendar-panel">
              <style>{`@media(min-width:701px){#calendar-panel{display:block!important;}}`}</style>

              {/* Month nav */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <button className="btn-ghost" onClick={prevMonth} style={{ padding:"6px 10px", fontSize:11 }}>← prev</button>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Lora',serif", fontSize:18, fontWeight:700, color:"#2c1a0e" }}>{MONTHS[month]}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#b08060" }}>{year}</div>
                </div>
                <button className="btn-ghost" onClick={nextMonth} style={{ padding:"6px 10px", fontSize:11 }}>next →</button>
              </div>

              {/* Stats */}
              <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                <div style={{ flex:1, background:activeColor.light, borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:activeColor.check, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>Streak</div>
                  <div style={{ fontFamily:"'Lora',serif", fontSize:20, fontWeight:700, color:"#2c1a0e" }}>🔥 {getStreak(activeHabit.id)}d</div>
                </div>
                <div style={{ flex:1, background:activeColor.light, borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:activeColor.check, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>This month</div>
                  <div style={{ fontFamily:"'Lora',serif", fontSize:20, fontWeight:700, color:"#2c1a0e" }}>{getMonthPct(activeHabit.id)}%</div>
                </div>
              </div>

              {/* Day headers */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:2 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:"#c4a882", padding:"3px 0" }}>{d}</div>)}
              </div>

              {/* Grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} style={{ aspectRatio:"1" }} />;
                  const done = isDone(activeHabit.id, day);
                  const future = isFuture(day);
                  const tod = isToday(day);
                  const selected = selectedDay === day;
                  return (
                    <div key={day} className={`day-cell ${future?"future":""} ${selected?"selected":""}`}
                      style={{ background:done?activeColor.bg:tod?activeColor.light:"#fdf8f3", opacity:future?0.3:1, cursor:future?"default":"pointer", border:`1.5px solid ${done?activeColor.bg:tod?activeColor.mid:"#f0dece"}` }}
                      onClick={() => !future && setSelectedDay(selected?null:day)}>
                      {tod && <div className="today-ring" style={{ borderColor:done?"rgba(255,255,255,0.5)":activeColor.bg }} />}
                      {done
                        ? <span style={{ fontSize:14, color:"#fff", fontWeight:700, lineHeight:1 }}>✓</span>
                        : <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:tod?600:400, color:tod?activeColor.check:"#c4a882" }}>{day}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Day detail (mobile: shown inline below calendar) */}
              {selectedDay && (
                <div className="fade-in" style={{ marginTop:16, background:activeColor.light, borderRadius:12, padding:16, border:`1px solid ${activeColor.mid}` }}>
                  <div style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:"#2c1a0e", marginBottom:12 }}>{MONTHS[month]} {selectedDay}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {habits.map((h,i) => {
                      const col = HABIT_COLORS[i%HABIT_COLORS.length];
                      const done = isDone(h.id, selectedDay);
                      return (
                        <div key={h.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, cursor:"pointer", background:done?col.bg:"#fff", border:`1.5px solid ${done?col.bg:col.mid}`, transition:"all 0.15s" }} onClick={() => toggle(selectedDay, h.id)}>
                          <div style={{ width:20,height:20,borderRadius:6,flexShrink:0,border:`2px solid ${done?"rgba(255,255,255,0.6)":"#e8d5c0"}`,background:done?"rgba(255,255,255,0.25)":"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>
                            {done && <span style={{ fontSize:12,color:done?"#fff":"#333",fontWeight:700 }}>✓</span>}
                          </div>
                          <span style={{ fontFamily:"'Lora',serif", fontSize:14, fontWeight:done?600:400, color:done?"#fff":"#b08060", flex:1 }}>{h.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display:"flex", gap:12, marginTop:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#c4a882" }}>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10,height:10,borderRadius:3,background:activeColor.bg,display:"inline-block" }}/> Done</span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10,height:10,borderRadius:3,background:activeColor.light,border:`1px solid ${activeColor.mid}`,display:"inline-block" }}/> Today</span>
                <span style={{ marginLeft:"auto", fontStyle:"italic" }}>tap a day to log</span>
              </div>
            </div>

            {/* Desktop sidebar */}
            <div className="desktop-sidebar">
              {/* Today panel */}
              {month===today.getMonth() && year===today.getFullYear() && (
                <div style={{ background:"#fff8f2", borderRadius:14, border:`1.5px solid ${activeColor.mid}`, padding:18 }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#b08060", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Today — {today.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {habits.map((h,i) => {
                      const col = HABIT_COLORS[i%HABIT_COLORS.length];
                      const done = isDone(h.id, today.getDate());
                      return (
                        <div key={h.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, cursor:"pointer", background:done?col.light:"#fff", border:`1.5px solid ${h.id===activeHabit.id?col.bg:done?col.mid:"#f0dece"}`, transition:"all 0.15s" }} onClick={() => toggle(today.getDate(), h.id)}>
                          <div style={{ width:20,height:20,borderRadius:6,flexShrink:0,border:`2px solid ${done?col.bg:col.mid}`,background:done?col.bg:"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}>
                            {done && <span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>✓</span>}
                          </div>
                          <span style={{ fontFamily:"'Lora',serif", fontSize:13, color:done?"#2c1a0e":"#b08060", fontWeight:done?600:400, flex:1 }}>{h.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All habits */}
              <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #f0dece", padding:18, boxShadow:"0 4px 20px rgba(200,100,30,0.07)" }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#b08060", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>All Habits</div>
                {habits.map((h,i) => {
                  const col = HABIT_COLORS[i%HABIT_COLORS.length];
                  const isActive = h.id===activeHabit.id;
                  return (
                    <div key={h.id} className="habit-row" style={{ background:isActive?col.light:"transparent", marginBottom:4 }}
                      onClick={() => { const dir=i>habitIdx?'right':'left'; setSlideDir(dir); setTimeout(()=>{setHabitIdx(i);setSelectedDay(null);setSlideDir(null);},180); }}>
                      <div style={{ width:8,height:8,borderRadius:"50%",background:col.bg,flexShrink:0 }} />
                      <span style={{ fontFamily:"'Lora',serif", fontSize:13, color:isActive?"#2c1a0e":"#8a6040", fontWeight:isActive?600:400, flex:1 }}>{h.name}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:col.check, background:col.light, padding:"2px 8px", borderRadius:20 }}>{getStreak(h.id)}d</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: Today tab panel */}
            <div style={{ display: activeTab === "today" ? "block" : "none" }} id="today-panel">
              <style>{`@media(min-width:701px){#today-panel{display:none!important;}}`}</style>
              <div style={{ background:"#fff8f2", borderRadius:14, border:`1.5px solid ${activeColor.mid}`, padding:18 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#b08060", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Today — {today.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {habits.map((h,i) => {
                    const col = HABIT_COLORS[i%HABIT_COLORS.length];
                    const done = isDone(h.id, today.getDate());
                    return (
                      <div key={h.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, cursor:"pointer", background:done?col.light:"#fff", border:`1.5px solid ${done?col.bg:"#f0dece"}`, transition:"all 0.15s" }} onClick={() => { setViewDate({year:today.getFullYear(),month:today.getMonth()}); toggle(today.getDate(), h.id); }}>
                        <div style={{ width:24,height:24,borderRadius:7,flexShrink:0,border:`2px solid ${done?col.bg:col.mid}`,background:done?col.bg:"#fff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}>
                          {done && <span style={{ fontSize:14,color:"#fff",fontWeight:700 }}>✓</span>}
                        </div>
                        <span style={{ fontFamily:"'Lora',serif", fontSize:15, color:done?"#2c1a0e":"#b08060", fontWeight:done?600:400, flex:1 }}>{h.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile: All habits tab panel */}
            <div style={{ display: activeTab === "all" ? "block" : "none" }} id="all-panel">
              <style>{`@media(min-width:701px){#all-panel{display:none!important;}}`}</style>
              <div style={{ background:"#fff", borderRadius:14, border:"1.5px solid #f0dece", padding:18 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#b08060", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>All Habits</div>
                {habits.map((h,i) => {
                  const col = HABIT_COLORS[i%HABIT_COLORS.length];
                  const isActive = h.id===activeHabit.id;
                  return (
                    <div key={h.id} className="habit-row" style={{ background:isActive?col.light:"transparent", marginBottom:6, padding:"12px 14px" }}
                      onClick={() => { const dir=i>habitIdx?'right':'left'; setSlideDir(dir); setTimeout(()=>{setHabitIdx(i);setSelectedDay(null);setSlideDir(null);setActiveTab("calendar");},180); }}>
                      <div style={{ width:10,height:10,borderRadius:"50%",background:col.bg,flexShrink:0 }} />
                      <span style={{ fontFamily:"'Lora',serif", fontSize:15, color:isActive?"#2c1a0e":"#8a6040", fontWeight:isActive?600:400, flex:1 }}>{h.name}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:col.check, background:col.light, padding:"3px 10px", borderRadius:20 }}>{getStreak(h.id)}d streak</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Mobile bottom navigation */}
      <div className="bottom-nav">
        {[
          { id:"calendar", icon:"📅", label:"Calendar" },
          { id:"today", icon:"✓", label:"Today" },
          { id:"all", icon:"☰", label:"Habits" },
        ].map(tab => (
          <button key={tab.id} className={`bottom-tab ${activeTab===tab.id?"active":""}`} onClick={() => setActiveTab(tab.id)}>
            <span style={{ fontSize:20 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
