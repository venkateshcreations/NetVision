import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const C = {
  primary:"#6366f1", cyan:"#06b6d4", green:"#10b981", amber:"#f59e0b",
  red:"#ef4444", pink:"#ec4899", purple:"#8b5cf6", orange:"#f97316",
  bg:"#f8fafc", card:"#ffffff", border:"#e2e8f0",
  text:"#0f172a", muted:"#64748b", sidebar:"#1e1b4b",
};

const ROLES = {
  Admin:    { label:"Network Admin",     icon:"🛠", color:"#6366f1", desc:"Full access — device management, automation, alerts", nav:["dashboard","devices","metrics","security","reports","ai","settings"], welcome:"Full admin access. All systems monitored." },
  SRE:      { label:"SRE / DevOps",      icon:"⚙️", color:"#06b6d4", desc:"Service health, performance, query engine, AI insights", nav:["dashboard","metrics","ai","reports"], welcome:"SRE view. Focus: service health & performance." },
  CIO:      { label:"CIO / Executive",   icon:"📊", color:"#10b981", desc:"Business KPIs, SLA dashboards, executive summaries only", nav:["dashboard","reports"], welcome:"Executive view: High-level KPIs and SLA overview." },
  Security: { label:"Security Analyst",  icon:"🔒", color:"#ec4899", desc:"Threat detection, anomaly analysis, audit logs", nav:["dashboard","security","reports","ai"], welcome:"Security monitoring active. Watching for threats." },
};

const ROLE_KEYS = ["Admin","SRE","CIO","Security"];
const ACCESS = {
  "Device Monitoring":  ["full",   "full",    "view",    "full"],
  "Query Engine":       ["full",   "full",    "limited", "full"],
  "SLA Reports":        ["full",   "view",    "full",    "view"],
  "Automation":         ["full",   "full",    "none",    "limited"],
  "Security Controls":  ["limited","limited", "none",    "full"],
  "AI Root Cause":      ["full",   "full",    "summary", "full"],
};

const hours = ["00:00","02:00","04:00","06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00"];
const r = (b,n) => Math.max(0, b + (Math.random()-0.5)*n);
const trafficData  = hours.map((t,i) => ({ t, inbound: r(120+Math.sin(i)*40,20), outbound: r(80+Math.cos(i)*30,15) }));
const cpuData      = hours.map(t => ({ t, v: r(55,40) }));
const memData      = hours.map(t => ({ t, v: r(68,20) }));
const latencyData  = hours.map(t => ({ t, v: r(12,8) }));
const secData      = hours.map(t => ({ t, blocked: r(30,20), suspicious: r(10,8) }));

const devices = [
  { id:1, name:"core-sw-01",  type:"Switch",   ip:"10.0.0.1", status:"healthy",  cpu:22, mem:41, uptime:"99.98%", location:"HYD-DC1" },
  { id:2, name:"edge-rt-02",  type:"Router",   ip:"10.0.1.1", status:"healthy",  cpu:61, mem:55, uptime:"99.95%", location:"HYD-DC1" },
  { id:3, name:"fw-asa-03",   type:"Firewall", ip:"10.0.2.1", status:"warning",  cpu:88, mem:77, uptime:"99.80%", location:"MUM-DC2" },
  { id:4, name:"ap-cisco-04", type:"AP",       ip:"10.0.3.1", status:"healthy",  cpu:18, mem:33, uptime:"100%",   location:"BLR-OFF" },
  { id:5, name:"srv-mon-05",  type:"Server",   ip:"10.0.4.1", status:"critical", cpu:97, mem:92, uptime:"97.10%", location:"HYD-DC1" },
  { id:6, name:"dist-sw-06",  type:"Switch",   ip:"10.0.5.1", status:"healthy",  cpu:35, mem:48, uptime:"99.99%", location:"DEL-DC3" },
];

const alerts = [
  { id:1, sev:"critical", msg:"CPU > 95% on srv-mon-05",           time:"2 min ago"  },
  { id:2, sev:"warning",  msg:"High memory on fw-asa-03",           time:"8 min ago"  },
  { id:3, sev:"info",     msg:"New device discovered: ap-cisco-07", time:"15 min ago" },
  { id:4, sev:"warning",  msg:"Interface flap on edge-rt-02 Gi0/1", time:"22 min ago" },
];

const slaItems = [
  { name:"Network Uptime", value:99.94, target:99.9,  color:C.green   },
  { name:"DNS Resolution", value:99.88, target:99.5,  color:C.cyan    },
  { name:"WAN Latency",    value:98.20, target:99.0,  color:C.amber   },
  { name:"VPN Tunnel",     value:99.99, target:99.9,  color:C.primary },
];

const pieData = [
  { name:"Switches", value:38, color:C.primary },
  { name:"Routers",  value:22, color:C.cyan    },
  { name:"Servers",  value:20, color:C.green   },
  { name:"FWs",      value:10, color:C.amber   },
  { name:"APs",      value:10, color:C.pink    },
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const heatData = Array.from({length:7},(_,day) => Array.from({length:24},(_,hr) => ({ day, hr, val: Math.floor(Math.random()*100) }))).flat();

// ── Primitives ──────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const m = { healthy:{bg:"#d1fae5",c:"#065f46",d:C.green}, warning:{bg:"#fef3c7",c:"#92400e",d:C.amber}, critical:{bg:"#fee2e2",c:"#991b1b",d:C.red}, info:{bg:"#dbeafe",c:"#1e40af",d:C.blue} }[status] || {bg:"#f1f5f9",c:"#475569",d:"#94a3b8"};
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 10px",borderRadius:999,background:m.bg,color:m.c,fontSize:11,fontWeight:700}}>
    <span style={{width:7,height:7,borderRadius:"50%",background:m.d}}/>{status?.toUpperCase()}
  </span>;
};

const Card = ({ children, style={} }) => (
  <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",...style}}>{children}</div>
);

const T = ({ icon, title, sub }) => (
  <div style={{marginBottom:16}}>
    <h2 style={{margin:0,fontSize:17,fontWeight:800,color:C.text,display:"flex",alignItems:"center",gap:7}}>{icon} {title}</h2>
    {sub && <p style={{margin:"3px 0 0",fontSize:12,color:C.muted}}>{sub}</p>}
  </div>
);

const KPI = ({ icon, label, value, sub, color, trend }) => (
  <Card>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
      <span style={{fontSize:26}}>{icon}</span>
      {trend !== undefined && <span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:999,color:trend>=0?C.green:C.red,background:trend>=0?"#d1fae5":"#fee2e2"}}>{trend>=0?"+":""}{trend}%</span>}
    </div>
    <div style={{fontSize:26,fontWeight:900,color:color||C.text,letterSpacing:"-1px"}}>{value}</div>
    <div style={{fontSize:13,fontWeight:700,color:C.text,marginTop:4}}>{label}</div>
    {sub && <div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}
  </Card>
);

const Bar2 = ({ value, color }) => (
  <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{flex:1,height:6,borderRadius:3,background:"#e2e8f0",overflow:"hidden"}}>
      <div style={{height:"100%",borderRadius:3,width:`${value}%`,background:color}}/>
    </div>
    <span style={{fontSize:12,fontWeight:700,minWidth:32}}>{value}%</span>
  </div>
);

const Warn = ({ msg }) => <div style={{padding:"10px 16px",borderRadius:10,background:"#fef3c7",border:"1px solid #f59e0b",fontSize:13,color:"#92400e",fontWeight:600,marginBottom:16}}>{msg}</div>;
const Info = ({ msg }) => <div style={{padding:"10px 16px",borderRadius:10,background:"#dbeafe",border:"1px solid #3b82f6",fontSize:13,color:"#1e40af",fontWeight:600,marginBottom:16}}>{msg}</div>;
const Locked = ({ feature }) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:12,color:C.muted}}>
    <span style={{fontSize:48}}>🔒</span>
    <span style={{fontSize:16,fontWeight:700,color:C.text}}>Access Restricted</span>
    <span style={{fontSize:13,textAlign:"center",maxWidth:300}}>Your role doesn't have permission to access <strong>{feature}</strong>.</span>
  </div>
);

const Heatmap = () => (
  <div>
    <div style={{display:"flex",gap:2}}>
      <div style={{display:"flex",flexDirection:"column",gap:2,marginRight:4}}>
        {DAYS.map(d=><div key={d} style={{height:18,fontSize:10,color:C.muted,display:"flex",alignItems:"center"}}>{d}</div>)}
      </div>
      {Array.from({length:24},(_,hr)=>(
        <div key={hr} style={{display:"flex",flexDirection:"column",gap:2}}>
          {DAYS.map((_,day)=>{const v=(heatData.find(h=>h.day===day&&h.hr===hr)||{val:0}).val;return <div key={day} style={{width:16,height:18,borderRadius:3,background:`rgba(99,102,241,${0.1+v/100*0.9})`}}/>;})}
        </div>
      ))}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8}}>
      <span style={{fontSize:10,color:C.muted}}>Low</span>
      {[0.1,0.3,0.5,0.7,1].map(a=><div key={a} style={{width:14,height:14,borderRadius:3,background:`rgba(99,102,241,${a})`}}/>)}
      <span style={{fontSize:10,color:C.muted}}>High</span>
    </div>
  </div>
);

const GradArea = ({ id, data, dkey, color, height=200, title }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={color} stopOpacity={0.3}/><stop offset="95%" stopColor={color} stopOpacity={0}/>
      </linearGradient></defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
      <XAxis dataKey="t" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/>
      <Tooltip contentStyle={{borderRadius:10}}/>
      <Area type="monotone" dataKey={dkey} stroke={color} fill={`url(#${id})`} strokeWidth={2.5} name={title}/>
    </AreaChart>
  </ResponsiveContainer>
);

// ── Role Dashboards ─────────────────────────────────────────────────────────
const AdminDash = () => (
  <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:14}}>
      <KPI icon="🟢" label="Devices Online"  value="847"       sub="of 853 total"          color={C.green}   trend={0.2}/>
      <KPI icon="⚠️" label="Active Alerts"   value="6"         sub="2 critical, 4 warning"  color={C.amber}   trend={-33}/>
      <KPI icon="📶" label="Avg Bandwidth"    value="2.4 Gbps"  sub="Peak: 3.8 Gbps today"  color={C.cyan}    trend={8}/>
      <KPI icon="⏱"  label="Avg Latency"     value="11.4ms"    sub="Threshold: 50ms"        color={C.primary} trend={-5}/>
      <KPI icon="🔄" label="Automations Run"  value="142"       sub="Last 24 hours"          color={C.purple}  trend={22}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
      <Card>
        <T icon="📈" title="Network Traffic (24h)" sub="Inbound vs Outbound — Gbps"/>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trafficData}>
            <defs>
              <linearGradient id="adIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.cyan} stopOpacity={0.3}/><stop offset="95%" stopColor={C.cyan} stopOpacity={0}/></linearGradient>
              <linearGradient id="adOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3}/><stop offset="95%" stopColor={C.primary} stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="t" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{borderRadius:10}}/>
            <Area type="monotone" dataKey="inbound" stroke={C.cyan} fill="url(#adIn)" strokeWidth={2} name="Inbound"/>
            <Area type="monotone" dataKey="outbound" stroke={C.primary} fill="url(#adOut)" strokeWidth={2} name="Outbound"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <T icon="🚨" title="Live Alerts"/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {alerts.map(a=>(
            <div key={a.id} style={{padding:"10px 12px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><Badge status={a.sev}/><span style={{fontSize:10,color:C.muted}}>{a.time}</span></div>
              <span style={{fontSize:12,color:C.text}}>{a.msg}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
      <Card><T icon="🖥" title="CPU (24h)"/><GradArea id="adCpu" data={cpuData} dkey="v" color={C.orange} height={140}/></Card>
      <Card><T icon="💾" title="Memory (24h)"/><GradArea id="adMem" data={memData} dkey="v" color={C.purple} height={140}/></Card>
      <Card><T icon="🔵" title="Device Types"/>
        <ResponsiveContainer width="100%" height={140}><PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={52} dataKey="value" label={({name,percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
          {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
        </Pie><Tooltip/></PieChart></ResponsiveContainer>
      </Card>
    </div>
  </div>
);

const SREDash = () => (
  <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:14}}>
      <KPI icon="✅" label="Services Healthy"  value="94%"   sub="47 of 50 services"  color={C.green}   trend={2}/>
      <KPI icon="⏱"  label="P99 Latency"       value="42ms"  sub="SLA: < 100ms"       color={C.cyan}    trend={-8}/>
      <KPI icon="🔁" label="Deploy Success"     value="99.1%" sub="Last 7 days"         color={C.primary} trend={1}/>
      <KPI icon="🤖" label="AI Anomalies"       value="3"     sub="2 reviewed"          color={C.amber}   trend={50}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card><T icon="⏱" title="Latency (ms) — 24h" sub="P99 across microservices"/><GradArea id="sreLat" data={latencyData} dkey="v" color={C.cyan} height={190}/></Card>
      <Card><T icon="🖥" title="CPU Utilization — 24h"/><GradArea id="sreCpu" data={cpuData} dkey="v" color={C.orange} height={190}/></Card>
    </div>
    <Card>
      <T icon="📊" title="Per-Device: CPU vs Memory"/>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={devices.map(d=>({name:d.name,cpu:d.cpu,mem:d.mem}))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/>
          <Tooltip contentStyle={{borderRadius:10}}/>
          <Bar dataKey="cpu" fill={C.orange} name="CPU %" radius={[4,4,0,0]}/><Bar dataKey="mem" fill={C.purple} name="Memory %" radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  </div>
);

const CIODash = () => (
  <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
      <KPI icon="🏢" label="Overall Uptime"  value="99.94%" sub="This month"                  color={C.green}  trend={0.04}/>
      <KPI icon="📉" label="Incidents (MTD)" value="3"      sub="vs 5 last month"              color={C.amber}  trend={-40}/>
      <KPI icon="💰" label="Est. Savings"    value="$12.4K" sub="Via automation this month"    color={C.cyan}   trend={18}/>
      <KPI icon="⚠️" label="Risk Score"      value="Low"    sub="2/10 — minimal exposure"      color={C.green}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {slaItems.map(s=>(
        <Card key={s.name}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontWeight:700,fontSize:14}}>{s.name}</span>
            <span style={{fontSize:11,color:C.muted}}>Target: {s.target}%</span>
          </div>
          <div style={{fontSize:36,fontWeight:900,color:s.value>=s.target?C.green:C.red,letterSpacing:"-1px"}}>{s.value.toFixed(2)}%</div>
          <div style={{marginTop:10,height:8,borderRadius:4,background:"#e2e8f0",overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${s.value}%`,background:s.color}}/></div>
          <div style={{marginTop:8,fontSize:12,fontWeight:700,color:s.value>=s.target?C.green:C.red}}>{s.value>=s.target?"✓ Meeting SLA":"⚠ Below Target"}</div>
        </Card>
      ))}
    </div>
    <Card><T icon="📈" title="Bandwidth Trend (24h)" sub="High-level network utilisation"/><GradArea id="cioTr" data={trafficData} dkey="inbound" color={C.green} height={170}/></Card>
  </div>
);

const SecDash = () => (
  <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:14}}>
      <KPI icon="🛡" label="Threats Blocked" value="1,284" sub="Last 24h"         color={C.green} trend={5}/>
      <KPI icon="🔍" label="Anomalies"        value="23"   sub="3 unreviewed"      color={C.amber} trend={-8}/>
      <KPI icon="🚫" label="Blocked IPs"      value="47"   sub="Active blocks"     color={C.red}   trend={12}/>
      <KPI icon="🔑" label="Auth Failures"    value="156"  sub="Last 24h"          color={C.pink}  trend={-3}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
      <Card>
        <T icon="📊" title="Threat Activity (24h)" sub="Blocked and suspicious connections"/>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={secData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="t" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{borderRadius:10}}/>
            <Bar dataKey="blocked" fill={C.red} name="Blocked" radius={[4,4,0,0]}/><Bar dataKey="suspicious" fill={C.amber} name="Suspicious" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card><T icon="🔥" title="Traffic Heatmap"/><Heatmap/></Card>
    </div>
    <Card>
      <T icon="🚨" title="Security Alerts"/>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {alerts.map(a=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}>
            <Badge status={a.sev}/><span style={{flex:1,fontSize:13}}>{a.msg}</span><span style={{fontSize:11,color:C.muted}}>{a.time}</span>
            <button style={{padding:"4px 12px",borderRadius:999,border:"none",background:C.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Investigate</button>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ── Page Views ──────────────────────────────────────────────────────────────
const DevicesPage = ({ role }) => {
  const acc = ACCESS["Device Monitoring"][ROLE_KEYS.indexOf(role)];
  const [f,setF] = useState("all");
  if(acc==="none") return <Locked feature="Device Monitoring"/>;
  const isView = acc==="view";
  const list = f==="all" ? devices : devices.filter(d=>d.status===f);
  return (
    <div>
      <T icon="📡" title="Device Inventory" sub="All monitored network devices"/>
      {isView && <Warn msg="👁 View-only mode — you can see device data but cannot make changes."/>}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["all","healthy","warning","critical"].map(s=>(
          <button key={s} onClick={()=>setF(s)} style={{padding:"6px 14px",borderRadius:999,cursor:"pointer",fontWeight:700,fontSize:12,background:f===s?C.primary:C.bg,color:f===s?"#fff":C.muted,border:f===s?"none":`1px solid ${C.border}`}}>{s.toUpperCase()}</button>
        ))}
      </div>
      <Card style={{padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:C.bg,borderBottom:`1px solid ${C.border}`}}>
            {["Device","Type","IP","Location","CPU","Memory","Uptime","Status",...(!isView?["Action"]:[])].map(h=>(
              <th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {list.map((d,i)=>(
              <tr key={d.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.card:"#fafbfc"}}>
                <td style={{padding:"12px 14px",fontWeight:700,fontSize:13}}>
                  <span style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:15}}>{d.type==="Switch"?"🔀":d.type==="Router"?"🌐":d.type==="Firewall"?"🛡":d.type==="AP"?"📶":"🖥"}</span>{d.name}
                  </span>
                </td>
                <td style={{padding:"12px 14px",fontSize:12,color:C.muted}}>{d.type}</td>
                <td style={{padding:"12px 14px",fontSize:12,fontFamily:"monospace"}}>{d.ip}</td>
                <td style={{padding:"12px 14px",fontSize:12}}>{d.location}</td>
                <td style={{padding:"12px 14px",minWidth:110}}><Bar2 value={d.cpu} color={d.cpu>85?C.red:d.cpu>60?C.amber:C.green}/></td>
                <td style={{padding:"12px 14px",minWidth:110}}><Bar2 value={d.mem} color={d.mem>85?C.red:d.mem>60?C.amber:C.purple}/></td>
                <td style={{padding:"12px 14px",fontSize:12,color:C.green,fontWeight:700}}>{d.uptime}</td>
                <td style={{padding:"12px 14px"}}><Badge status={d.status}/></td>
                {!isView && <td style={{padding:"12px 14px"}}><button style={{padding:"4px 12px",borderRadius:999,border:`1px solid ${C.border}`,background:C.card,fontSize:11,cursor:"pointer",fontWeight:600}}>Manage</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const MetricsPage = ({ role }) => {
  const acc = ACCESS["Query Engine"][ROLE_KEYS.indexOf(role)];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <T icon="📊" title="Performance Metrics" sub="Time-series analysis across infrastructure"/>
      {acc==="limited" && <Warn msg="⚠️ Limited access — advanced queries and data export are disabled for your role."/>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card><T icon="⏱" title="Latency (ms)"/><GradArea id="mLat" data={latencyData} dkey="v" color={C.cyan} height={160}/></Card>
        <Card><T icon="🖥" title="CPU Utilization (%)"/><GradArea id="mCpu" data={cpuData} dkey="v" color={C.orange} height={160}/></Card>
        <Card><T icon="💾" title="Memory Utilization (%)"/><GradArea id="mMem" data={memData} dkey="v" color={C.purple} height={160}/></Card>
        <Card><T icon="📶" title="Inbound Traffic (Gbps)"/><GradArea id="mTraf" data={trafficData} dkey="inbound" color={C.green} height={160}/></Card>
      </div>
      {acc!=="limited" && (
        <Card>
          <T icon="🔍" title="Custom Query Engine" sub="Filter and slice metrics by tag, host, or time"/>
          <div style={{display:"flex",gap:8}}>
            <input defaultValue="show devices where cpu > 80% last 24h" style={{flex:1,padding:"10px 14px",borderRadius:8,border:`1.5px solid ${C.border}`,fontFamily:"monospace",fontSize:13,outline:"none"}}/>
            <button style={{padding:"10px 20px",borderRadius:8,background:C.primary,color:"#fff",border:"none",fontWeight:700,cursor:"pointer"}}>Run →</button>
          </div>
        </Card>
      )}
    </div>
  );
};

const SecurityPage = ({ role }) => {
  const acc = ACCESS["Security Controls"][ROLE_KEYS.indexOf(role)];
  if(acc==="none") return <Locked feature="Security Controls"/>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <T icon="🔒" title="Security Monitoring" sub="Threat detection, anomalies, access control"/>
      {acc==="limited" && <Warn msg="⚠️ Limited access — you can view threats but cannot lock nodes or trigger SOC workflows."/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:14}}>
        <KPI icon="🛡" label="Threats Blocked" value="1,284" sub="Last 24h" color={C.green} trend={5}/>
        <KPI icon="🔍" label="Anomalies"        value="23"   sub="3 unreviewed" color={C.amber} trend={-8}/>
        <KPI icon="🚫" label="Blocked IPs"      value="47"   sub="Active blocks" color={C.red} trend={12}/>
        <KPI icon="🔑" label="Auth Failures"    value="156"  sub="Last 24h" color={C.pink} trend={-3}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <Card>
          <T icon="📊" title="Threat Activity (24h)"/>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={secData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="t" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip contentStyle={{borderRadius:10}}/>
              <Bar dataKey="blocked" fill={C.red} name="Blocked" radius={[4,4,0,0]}/><Bar dataKey="suspicious" fill={C.amber} name="Suspicious" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card><T icon="🔥" title="Traffic Heatmap"/><Heatmap/></Card>
      </div>
      <Card>
        <T icon="🚨" title="Security Alerts"/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {alerts.map(a=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}>
              <Badge status={a.sev}/><span style={{flex:1,fontSize:13}}>{a.msg}</span><span style={{fontSize:11,color:C.muted}}>{a.time}</span>
              {acc==="full" && <button style={{padding:"4px 12px",borderRadius:999,border:"none",background:C.red,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Lock Node</button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ReportsPage = ({ role }) => {
  const acc = ACCESS["SLA Reports"][ROLE_KEYS.indexOf(role)];
  const canExport = acc==="full";
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <T icon="📋" title="SLA Reports & Access Matrix" sub="Compliance, SLA tracking, and role permissions"/>
      {!canExport && <Info msg="ℹ️ View-only mode — PDF/email export requires Admin or CIO role."/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16}}>
        {slaItems.map(s=>(
          <Card key={s.name}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14}}>{s.name}</span>
              <span style={{fontSize:11,color:C.muted}}>Target: {s.target}%</span>
            </div>
            <div style={{fontSize:36,fontWeight:900,color:s.value>=s.target?C.green:C.red,letterSpacing:"-1px"}}>{s.value.toFixed(2)}%</div>
            <div style={{marginTop:10,height:8,borderRadius:4,background:"#e2e8f0",overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${s.value}%`,background:s.color}}/></div>
            <div style={{marginTop:8,fontSize:12,fontWeight:700,color:s.value>=s.target?C.green:C.red}}>{s.value>=s.target?"✓ Meeting SLA":"⚠ Below Target"}</div>
            {canExport && <button style={{marginTop:12,width:"100%",padding:"7px",borderRadius:8,background:C.bg,border:`1px solid ${C.border}`,fontSize:12,fontWeight:700,cursor:"pointer",color:C.primary}}>Export PDF</button>}
          </Card>
        ))}
      </div>
      <Card>
        <T icon="🔑" title="Access Level Matrix" sub="Role-based feature permissions — your role is highlighted"/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}>
            <thead><tr style={{background:C.bg}}>
              <th style={{padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase"}}>Feature</th>
              {ROLE_KEYS.map((rk,ri)=>(
                <th key={rk} style={{padding:"11px 14px",textAlign:"center",fontSize:12,fontWeight:800,color:[C.primary,C.cyan,C.green,C.pink][ri],
                  background:rk===role?`${[C.primary,C.cyan,C.green,C.pink][ri]}10`:"transparent"}}>
                  {rk==="Admin"?"🛠":rk==="SRE"?"⚙️":rk==="CIO"?"📊":"🔒"} {rk}
                  {rk===role && <span style={{display:"block",fontSize:9,color:C.muted,fontWeight:600}}>(You)</span>}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {Object.entries(ACCESS).map(([feat,vals],i)=>(
                <tr key={feat} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.card:C.bg}}>
                  <td style={{padding:"11px 14px",fontWeight:600,fontSize:13}}>{feat}</td>
                  {vals.map((v,j)=>{
                    const isMe = ROLE_KEYS[j]===role;
                    const chip = {full:{bg:"#d1fae5",c:"#065f46",l:"✓ Full"},view:{bg:"#dbeafe",c:"#1e40af",l:"👁 View"},limited:{bg:"#fef3c7",c:"#92400e",l:"⚠ Limited"},summary:{bg:"#ede9fe",c:"#5b21b6",l:"📊 Summary"},none:{bg:"#fee2e2",c:"#991b1b",l:"✗ None"}}[v];
                    return (
                      <td key={j} style={{padding:"11px 14px",textAlign:"center",background:isMe?`${[C.primary,C.cyan,C.green,C.pink][j]}08`:"transparent"}}>
                        <span style={{display:"inline-block",padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:chip.bg,color:chip.c,
                          boxShadow:isMe?`0 0 0 2px ${[C.primary,C.cyan,C.green,C.pink][j]}`:"none"}}>{chip.l}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{margin:"12px 0 0",fontSize:12,color:C.muted}}>🔷 Highlighted column = your current role ({role})</p>
      </Card>
    </div>
  );
};

const AIPage = ({ role }) => {
  const [input,setInput] = useState("");
  const [msgs,setMsgs] = useState([{role:"ai",text:`Hello! I'm your AI Network Assistant, configured for the **${role}** role.\n\nI'll provide insights tailored to your permissions and responsibilities. How can I help you today?`}]);
  const [loading,setLoading] = useState(false);
  const bottomRef = useRef(null);
  const suggestions = {
    Admin:    ["Show all devices above 80% CPU","What caused the last critical alert?","Run remediation on srv-mon-05","List all devices in HYD-DC1"],
    SRE:      ["Detect anomalies in last 6 hours","Show P99 latency trend","Identify root cause of memory spike","Compare traffic week over week"],
    CIO:      ["Summarize this month's SLA","What is our network risk score?","Predict downtime risk for next week","Give me an executive summary"],
    Security: ["Show suspicious traffic patterns","Which IPs are blocked today?","Analyze baseline deviations","Flag unusual auth failures"],
  }[role]||[];

  const send = async(q) => {
    const query = q||input;
    if(!query.trim()) return;
    setMsgs(m=>[...m,{role:"user",text:query}]);
    setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          system:`You are an AI network monitoring assistant for a ${role} user on a NOC dashboard.
Devices: ${devices.map(d=>`${d.name}(${d.status},CPU:${d.cpu}%,MEM:${d.mem}%,loc:${d.location})`).join(", ")}.
Active alerts: ${alerts.map(a=>a.msg).join("; ")}.
Role context: ${role==="CIO"?"Focus on business impact, SLA trends, and high-level executive summaries only. Avoid technical jargon.":role==="Security"?"Focus on security threats, anomaly patterns, and SOC workflows. Suggest containment steps.":role==="SRE"?"Focus on service health, root cause analysis, latency, and deployment health.":"Provide full technical details. Suggest automation scripts and remediation steps as needed."}
Be concise and actionable. Use bullet points for lists. Keep responses under 200 words.`,
          messages:[{role:"user",content:query}]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c=>c.text||"").join("")||"Unable to process response.";
      setMsgs(m=>[...m,{role:"ai",text}]);
    } catch {
      setMsgs(m=>[...m,{role:"ai",text:"⚠️ Connection error. Please try again."}]);
    }
    setLoading(false);
  };

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <T icon="🤖" title="AI Network Assistant" sub={`Context-aware insights tuned for ${ROLES[role].label} role`}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {suggestions.map(s=>(
          <button key={s} onClick={()=>send(s)} style={{padding:"6px 12px",borderRadius:999,border:`1px solid ${C.border}`,background:C.bg,color:C.primary,fontSize:12,fontWeight:600,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
      <div style={{overflowY:"auto",background:C.bg,borderRadius:12,padding:16,border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:12,minHeight:280,maxHeight:400}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:12,background:m.role==="user"?C.primary:C.card,color:m.role==="user"?"#fff":C.text,border:m.role==="ai"?`1px solid ${C.border}`:"none",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
              {m.role==="ai" && <span style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>🤖 AI ({role} context)</span>}
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div style={{display:"flex",gap:5,padding:"8px 14px"}}>
          {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.primary,animation:`bounce 0.8s ease-in-out ${i*0.15}s infinite`}}/>)}
        </div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder={`Ask as ${role}: e.g. "${suggestions[0]}"`}
          style={{flex:1,padding:"12px 16px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={()=>send()} style={{padding:"12px 20px",borderRadius:10,background:C.primary,color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer"}}>Send →</button>
      </div>
    </div>
  );
};

// ── Login ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [sel,setSel] = useState(null);
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#1e1b4b 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif",padding:24}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#6366f1,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📡</div>
        <span style={{color:"#fff",fontSize:30,fontWeight:900,letterSpacing:"-1.5px"}}>NetVision</span>
      </div>
      <p style={{color:"rgba(255,255,255,0.55)",marginBottom:40,fontSize:15,textAlign:"center"}}>Role-based Network Monitoring Platform — select your role to continue</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14,maxWidth:760,width:"100%"}}>
        {Object.entries(ROLES).map(([key,rc])=>(
          <button key={key} onClick={()=>setSel(key)} style={{padding:"22px",borderRadius:16,cursor:"pointer",textAlign:"left",transition:"all 0.2s",
            border:sel===key?`2px solid ${rc.color}`:"2px solid rgba(255,255,255,0.1)",
            background:sel===key?"rgba(255,255,255,0.16)":"rgba(255,255,255,0.05)"}}>
            <div style={{fontSize:30,marginBottom:10}}>{rc.icon}</div>
            <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:5}}>{rc.label}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{rc.desc}</div>
            <div style={{marginTop:10,fontSize:11,color:rc.color,fontWeight:700}}>
              {rc.nav.length} sections accessible
            </div>
          </button>
        ))}
      </div>
      <button onClick={()=>sel&&onLogin(sel)} disabled={!sel} style={{marginTop:32,padding:"14px 48px",borderRadius:12,border:"none",fontSize:15,fontWeight:800,cursor:sel?"pointer":"not-allowed",transition:"all 0.2s",
        background:sel?"linear-gradient(135deg,#6366f1,#06b6d4)":"rgba(255,255,255,0.1)",color:"#fff",opacity:sel?1:0.4}}>
        {sel?`Enter as ${ROLES[sel].label} →`:"Select a Role to Continue"}
      </button>
    </div>
  );
};

// ── Nav ──────────────────────────────────────────────────────────────────────
const ALL_NAV = [
  {icon:"🏠",label:"Dashboard",id:"dashboard"},
  {icon:"📡",label:"Devices",  id:"devices"},
  {icon:"📊",label:"Metrics",  id:"metrics"},
  {icon:"🔒",label:"Security", id:"security"},
  {icon:"📋",label:"Reports",  id:"reports"},
  {icon:"🤖",label:"AI Assist",id:"ai"},
  {icon:"⚙️",label:"Settings", id:"settings"},
];

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [role,setRole]         = useState(null);
  const [view,setView]         = useState("dashboard");
  const [open,setOpen]         = useState(true);
  const [time,setTime]         = useState(new Date());

  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t); },[]);

  const switchRole = (newRole) => {
    setRole(newRole);
    if(!ROLES[newRole].nav.includes(view)) setView("dashboard");
  };

  if(!role) return <Login onLogin={r=>{setRole(r);setView("dashboard");}}/>;

  const rc = ROLES[role];
  const navItems = ALL_NAV.filter(n=>rc.nav.includes(n.id));

  const renderView = () => {
    const dashMap = {Admin:<AdminDash/>,SRE:<SREDash/>,CIO:<CIODash/>,Security:<SecDash/>};
    switch(view){
      case "dashboard": return dashMap[role];
      case "devices":   return <DevicesPage role={role}/>;
      case "metrics":   return <MetricsPage role={role}/>;
      case "security":  return <SecurityPage role={role}/>;
      case "reports":   return <ReportsPage role={role}/>;
      case "ai":        return <AIPage role={role}/>;
      default:          return <div style={{color:C.muted,padding:20}}>Settings panel — configure monitoring preferences.</div>;
    }
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'DM Sans','Segoe UI',sans-serif",background:C.bg,color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:#f1f5f9;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* Sidebar */}
      <div style={{width:open?228:66,background:C.sidebar,display:"flex",flexDirection:"column",transition:"width 0.22s ease",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowX:"hidden"}}>
        <div style={{padding:"16px 14px",borderBottom:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📡</div>
          {open&&<span style={{color:"#fff",fontWeight:900,fontSize:17,whiteSpace:"nowrap"}}>NetVision</span>}
        </div>
        {open&&(
          <div style={{margin:"10px 10px 4px",padding:"10px 12px",borderRadius:12,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)"}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:700,textTransform:"uppercase",marginBottom:5}}>Active Role</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>{rc.icon}</span>
              <div>
                <div style={{color:"#fff",fontWeight:700,fontSize:13}}>{rc.label}</div>
                <div style={{fontSize:10,color:rc.color,fontWeight:600}}>{rc.nav.length} sections</div>
              </div>
            </div>
          </div>
        )}
        <nav style={{flex:1,padding:"8px 7px"}}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:11,padding:"11px 11px",borderRadius:10,border:"none",cursor:"pointer",marginBottom:3,background:view===item.id?"rgba(255,255,255,0.17)":"transparent",color:view===item.id?"#fff":"rgba(255,255,255,0.5)",fontWeight:view===item.id?700:500,fontSize:14,textAlign:"left",transition:"background 0.15s",whiteSpace:"nowrap",fontFamily:"inherit"}}>
              <span style={{fontSize:17,flexShrink:0}}>{item.icon}</span>
              {open&&<span>{item.label}</span>}
            </button>
          ))}
          {/* Disabled nav items shown greyed for non-accessible sections */}
          {open && ALL_NAV.filter(n=>!rc.nav.includes(n.id)).map(item=>(
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 11px",borderRadius:10,marginBottom:3,color:"rgba(255,255,255,0.2)",fontSize:14,cursor:"not-allowed",whiteSpace:"nowrap"}}>
              <span style={{fontSize:17}}>{item.icon}</span>
              <span>{item.label}</span>
              <span style={{marginLeft:"auto",fontSize:10}}>🔒</span>
            </div>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",gap:5}}>
          {open&&<button onClick={()=>setRole(null)} style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.18)",background:"transparent",color:"rgba(255,255,255,0.65)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>🚪 Switch Role</button>}
          <button onClick={()=>setOpen(s=>!s)} style={{width:"100%",padding:"7px",borderRadius:8,border:"none",background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.55)",cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
            {open?"◀":"▶"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"12px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <h1 style={{margin:0,fontSize:18,fontWeight:800}}>{ALL_NAV.find(n=>n.id===view)?.label||"Dashboard"}</h1>
            <span style={{padding:"3px 10px",borderRadius:999,background:"#d1fae5",color:"#065f46",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite",display:"inline-block"}}/>LIVE
            </span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:12,color:C.muted,fontFamily:"monospace"}}>{time.toLocaleTimeString()}</span>
            <select value={role} onChange={e=>switchRole(e.target.value)} style={{padding:"7px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",color:rc.color,outline:"none"}}>
              {Object.entries(ROLES).map(([k,rr])=><option key={k} value={k}>{rr.icon} {rr.label}</option>)}
            </select>
            <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${rc.color},#06b6d4)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:15}}>{rc.icon}</div>
          </div>
        </div>
        {/* Role context banner */}
        <div style={{background:`linear-gradient(90deg,${rc.color}18,transparent)`,borderBottom:`1px solid ${C.border}`,padding:"7px 22px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,fontWeight:700,color:rc.color}}>{rc.icon} {rc.label}</span>
          <span style={{fontSize:12,color:C.muted}}>—</span>
          <span style={{fontSize:12,color:C.muted}}>{rc.welcome}</span>
        </div>
        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:22}}>{renderView()}</div>
      </div>
    </div>
  );
}
