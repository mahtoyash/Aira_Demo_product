import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Home, Layout, Video, Settings, Users, ArrowUpRight, Copy, Bell, Plus, Calendar, MoreHorizontal, MessageSquare } from 'lucide-react';

export default function Dashboard3D() {
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScaleFactor(width < 1400 ? Math.max(width / 1450, 0.25) : 1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="w-full py-24 bg-[#0a0a0c] flex justify-center items-center overflow-hidden font-[family-name:var(--font-geist)] px-0 sm:px-8">
      {/* 3D Perspective Container */}
      <div style={{ transform: `scale(${scaleFactor})`, transformOrigin: 'center center', transition: 'transform 0.3s ease-out' }}>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        className="w-[1400px] min-w-[1200px] shrink-0 h-[900px] bg-[#1c1c1e] rounded-[32px] overflow-hidden flex relative shadow-[0_20px_100px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/10"
      >
        
        {/* Sidebar */}
        <div className="w-[260px] h-full bg-[#18181b] border-r border-white/5 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 text-white">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-full shadow-inner" />
            </div>
            <div>
              <h2 className="font-semibold text-[15px] leading-tight">Aira Workspace</h2>
              <p className="text-xs text-zinc-400">Enterprise Plan</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-zinc-500 ml-auto" />
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="w-full bg-[#27272a] rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none border border-white/5 placeholder:text-zinc-500 focus:border-white/20 transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] bg-[#3f3f46] text-zinc-300 font-medium">⌘K</div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 mb-3 tracking-wider">MAIN MENU</p>
              <div className="space-y-1">
                <NavItem icon={<Home className="w-4 h-4" />} label="Home" active />
                <NavItem icon={<Layout className="w-4 h-4" />} label="Sensors" />
                <NavItem icon={<Video className="w-4 h-4" />} label="Analytics" />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-zinc-500 mb-3 tracking-wider">SETTINGS</p>
              <div className="space-y-1">
                <NavItem icon={<Copy className="w-4 h-4" />} label="Export Data" />
                <NavItem icon={<Settings className="w-4 h-4" />} label="Configuration" />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-zinc-500 mb-3 tracking-wider">TEAMS</p>
              <div className="space-y-1">
                <NavItem icon={<Users className="w-4 h-4" />} label="Operations" />
                <NavItem icon={<MessageSquare className="w-4 h-4" />} label="Safety Team" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center gap-3">
            <img src="https://ui-avatars.com/api/?name=Michael+R&background=random" alt="User" className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-sm font-medium text-white">Michael Robinson</p>
              <p className="text-[11px] text-zinc-500">michael.r@aira.co</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 h-full flex flex-col">
          {/* Header */}
          <div className="h-[90px] flex items-center justify-between px-8">
            <h1 className="text-[28px] text-white font-medium">Welcome, Michael</h1>
            <div className="flex gap-4">
              <ActionButton icon={<Video className="w-4 h-4" />} label="AI Insight" sublabel="Generate summary" />
              <ActionButton icon={<Copy className="w-4 h-4" />} label="Export PDF" sublabel="Download report" />
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="flex-1 p-8 pt-0 flex gap-6 overflow-hidden">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Top Cards Row */}
              <div className="flex h-[220px] gap-6">
                
                {/* CO2 Analysis Card */}
                <Card className="flex-1 p-5 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white text-[15px] font-medium">CO2 Analysis</h3>
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                      <Copy className="w-3 h-3 text-zinc-400" />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-between px-1 gap-4">
                    <div className="relative w-28 h-28 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Background track */}
                        <circle cx="50" cy="50" r="40" stroke="#3f3f46" strokeWidth="12" fill="none" />
                        {/* Purple */}
                        <circle cx="50" cy="50" r="40" stroke="#a855f7" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset="130" strokeLinecap="round" />
                        {/* Pink */}
                        <circle cx="50" cy="50" r="40" stroke="#ec4899" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset="200" strokeLinecap="round" className="origin-center rotate-90" />
                      </svg>
                      {/* Inner dark circle to enhance 3D feel */}
                      <div className="absolute inset-2 bg-[#27272a] rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <LegendItem color="bg-[#a855f7]" title="53%" desc="Normal (400)" />
                      <LegendItem color="bg-[#ec4899]" title="24%" desc="Elevated (800)" />
                      <LegendItem color="bg-[#e4e4e7]" title="23%" desc="Peak Warning" />
                    </div>
                  </div>
                </Card>

                {/* PPM Variance Card */}
                <Card className="flex-[1.2] p-5 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white text-[15px] font-medium">Historical PPM</h3>
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                      <Copy className="w-3 h-3 text-zinc-400" />
                    </div>
                  </div>
                  <div className="flex-1 relative flex items-center">
                    <div className="w-full h-[80px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMTAiIGZpbGw9IiMzZjNmNDYiLz48L3N2Zz4=')] opacity-50 relative bottom-4">
                       <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                         <path d="M0,50 Q10,20 20,40 T40,60 T60,30 T80,70 T100,50" fill="none" stroke="#a855f7" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                         <path d="M0,60 Q15,40 25,70 T45,80 T65,40 T85,60 T100,50" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                       </svg>
                    </div>
                    {/* Fake stats overlays */}
                    <div className="absolute bottom-2 left-0 flex flex-col">
                       <span className="text-[22px] text-white font-medium">61%</span>
                       <span className="text-[11px] text-zinc-500">Stable</span>
                    </div>
                    <div className="absolute top-0 right-10 flex flex-col items-end">
                       <span className="text-[22px] text-white font-medium">28%</span>
                       <span className="text-[11px] text-zinc-500">Fluctuating</span>
                    </div>
                  </div>
                </Card>

                {/* Daily Peaks Card */}
                <Card className="flex-[0.8] p-5 flex flex-col relative overflow-hidden">
                   <div className="absolute right-0 top-0 w-32 h-32 bg-[#a855f7]/20 blur-3xl rounded-full"></div>
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-white text-[15px] font-medium">Daily Peaks</h3>
                    <div className="flex items-center gap-1 text-[11px] bg-white/5 px-2 py-1 rounded text-zinc-400">
                      Last Week <MoreHorizontal className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 relative z-10">
                    {/* Y Axis fake labels */}
                    <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-zinc-500 py-1">
                      <span>1200</span><span>800</span><span>400</span><span>0</span>
                    </div>
                    <div className="w-full h-full ml-6 flex items-end justify-between gap-2">
                       {/* Bars */}
                       <Bar height="h-[40%]" day="Sun" />
                       <Bar height="h-[60%]" day="Mon" active />
                       <Bar height="h-[80%]" day="Tue" active variant />
                       <Bar height="h-[50%]" day="Wed" />
                       <Bar height="h-[90%]" day="Thu" active />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Task / Event Manager */}
              <Card className="flex-1 p-5 flex flex-col relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white text-[15px] font-medium">Sensor Status Logs</h3>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2 text-[12px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-zinc-300 font-medium cursor-pointer transition">
                      <Calendar className="w-3 h-3" /> March 2026
                    </div>
                    <div className="flex items-center gap-2 text-[12px] bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 px-3 py-1.5 rounded-lg text-blue-300 font-medium cursor-pointer transition">
                      <Plus className="w-3 h-3" /> Add Note
                    </div>
                  </div>
                </div>

                {/* Calendar Layout */}
                <div className="flex-1 flex gap-4">
                  {/* Time col */}
                  <div className="w-10 flex flex-col justify-between py-10 text-[10px] text-zinc-500 font-medium">
                    <span>10:00</span><span>11:00</span><span>12:00</span><span>13:00</span><span>14:00</span>
                  </div>
                  {/* Columns */}
                  <div className="flex-1 grid grid-cols-3 gap-4 h-full relative">
                    {/* Mon */}
                    <div className="flex flex-col border-l border-white/5 pl-4 relative">
                       <h4 className="text-xs text-zinc-500 font-medium mb-4">Mon <br/><span className="text-[10px]">March, 09</span></h4>
                       <EventCard top=" top-[5%]" height="h-[120px]" color="border-[#ec4899]" title="Boardroom Spike" desc="CO2 surpassed 1000ppm during the morning staff meeting." progress="75%" />
                       <EventCard top=" top-[60%]" height="h-[100px]" color="border-[#3b82f6]" title="HVAC Activated" desc="Automatic ventilation kicked in the east wing." />
                    </div>
                    {/* Tue */}
                    <div className="flex flex-col border-l border-white/5 pl-4 relative">
                       <h4 className="text-xs text-zinc-500 font-medium mb-4 flex gap-2">Tue <br/><span className="text-[10px]">March, 10</span> <span className="w-4 h-4 bg-[#a855f7] rounded-full text-[9px] text-white flex items-center justify-center">4</span></h4>
                       <EventCard top=" top-[30%]" height="h-[140px]" color="border-[#a855f7]" title="Sensor Maintenance" desc="Calibration scheduled for Lobby and Hallway nodes." users={["https://ui-avatars.com/api/?name=Alex&background=random"]} />
                       <EventCard top=" top-[80%]" height="h-[80px]" color="border-zinc-500" title="Weekly Report" desc="Generated automated AI insights for last week." />
                    </div>
                    {/* Wed */}
                    <div className="flex flex-col border-l border-white/5 pl-4 relative">
                       <h4 className="text-xs text-zinc-500 font-medium mb-4 flex gap-2">Wed <br/><span className="text-[10px]">March, 11</span> <span className="w-4 h-4 bg-[#ec4899] rounded-full text-[9px] text-white flex items-center justify-center">2</span></h4>
                       <EventCard top=" top-[20%]" height="h-[110px]" color="border-[#3b82f6]" title="System Update" desc="Firmware 2.4 pushing to all remote nodes." users={["https://ui-avatars.com/api/?name=Sarah&background=random", "https://ui-avatars.com/api/?name=John&background=random"]} />
                       <EventCard top=" top-[65%]" height="h-[130px]" color="border-[#2dd4bf]" title="Threshold Alert" desc="CO2 dropped below 400ppm in Server Room." options={["Check ventilation", "Verify sensor data", "Log reading"]} />
                    </div>
                  </div>
                </div>
              </Card>

            </div>

            {/* Right Column / Inboxes */}
            <Card className="w-[320px] p-5 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                   <h3 className="text-white text-[15px] font-medium">Alerts</h3>
                   <span className="bg-[#a855f7] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">16</span>
                </div>
                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                  <Copy className="w-3 h-3 text-zinc-400" />
                </div>
              </div>
              
              <div className="relative mb-6">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   className="w-full bg-[#18181b] rounded-lg py-2.5 pl-9 pr-4 text-sm text-zinc-200 outline-none border border-white/5 focus:border-white/20 transition-colors shadow-inner"
                 />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                 <MessageCard 
                    name="System Auto-Alert"
                    topic="High CO2 Concentration"
                    tag="Critical"
                    body="Warning! Boardroom Alpha is experiencing sustained CO2 levels above 1200ppm for the last 45 minutes."
                 />
                 <MessageCard 
                    name="Sarah Jenkins"
                    topic="HVAC Override"
                    tag="Notice"
                    icon="bg-[#3b82f6]"
                    body="I've manually increased the air intake for the second floor to help clear out the spike we saw at 2pm."
                 />
                 <MessageCard 
                    name="Weekly AI Digest"
                    topic="Air Quality Summary"
                    tag="Report"
                    icon="bg-[#a855f7]"
                    body="Your building scored a 94/100 on air quality this week. Click here to view the breakdown and energy savings."
                 />
              </div>
            </Card>

          </div>
        </div>

      </motion.div>
      </div>
    </section>
  );
}

// ------ Subcomponents for the Dashboard ------

const NavItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${active ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}>
    {icon}
    <span className="text-[13px]">{label}</span>
  </div>
);

const ActionButton = ({ icon, label, sublabel }) => (
  <button className="flex items-center gap-3 bg-[#27272a] hover:bg-[#3f3f46] border border-white/5 p-2 rounded-xl transition shadow-md group">
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300 group-hover:text-white transition">
      {icon}
    </div>
    <div className="text-left pr-2">
      <p className="text-white text-[13px] font-medium leading-tight">{label}</p>
      <p className="text-[11px] text-zinc-500 leading-tight">{sublabel}</p>
    </div>
  </button>
);

const Card = ({ children, className }) => (
  <div className={`bg-[#27272a]/50 rounded-2xl border border-white/5 shadow-lg backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

const LegendItem = ({ color, title, desc }) => (
  <div className="flex items-center gap-3 border-l-2 border-white/10 pl-3">
    <div className="relative">
      <div className={`w-1 h-8 rounded-full ${color}`} />
    </div>
    <div className="flex flex-col">
      <span className="text-white text-[15px] font-semibold">{title}</span>
      <span className="text-zinc-500 text-[11px] font-medium">{desc}</span>
    </div>
  </div>
);

const Bar = ({ height, day, active, variant }) => {
  let bgClass = "bg-[#3f3f46]";
  if (active) bgClass = variant ? "bg-gradient-to-t from-[#3b82f6] to-[#a855f7]" : "bg-gradient-to-t from-[#a855f7] to-[#ec4899]";
  return (
    <div className="flex flex-col items-center justify-end gap-2 flex-1 relative group h-full">
      <div className={`w-full ${height} ${bgClass} rounded-t-sm rounded-b-sm border-t border-white/20 transition-all duration-300 group-hover:opacity-80`}>
         {/* Top specular reflection */}
         <div className="w-full h-1 bg-white/20 rounded-t-sm"></div>
      </div>
      <span className="text-[10px] text-zinc-500 font-medium">{day}</span>
    </div>
  );
};

const EventCard = ({ top, height, color, title, desc, progress, users, options }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`absolute left-4 right-2 ${top} ${height} bg-[#18181b] border border-white/5 rounded-xl p-3 flex flex-col shadow-lg border-l-4 ${color} z-10 cursor-pointer overflow-hidden group`}
  >
    <div className="flex justify-between items-start mb-2">
      <h5 className="text-[13px] text-white font-medium truncate">{title}</h5>
      <div className="bg-white/10 p-1 rounded">
        <MoreHorizontal className="w-3 h-3 text-zinc-400" />
      </div>
    </div>
    <p className="text-[10px] text-zinc-400 leading-snug flex-1 mb-2">
      {desc}
    </p>
    
    {progress && (
      <div className="mt-auto">
        <div className="flex justify-between text-[9px] text-white mb-1 font-medium">
          <span>Mitigation</span>
          <span>{progress}</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#ec4899]" style={{ width: progress }}></div>
        </div>
      </div>
    )}

    {users && (
      <div className="flex -space-x-2 mt-auto">
        {users.map((url, i) => (
          <img key={i} src={url} alt="User" className="w-5 h-5 rounded-full border border-[#18181b]" />
        ))}
      </div>
    )}

    {options && (
      <div className="flex flex-col gap-1 mt-auto">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1">
             <div className="w-2 h-2 rounded border border-zinc-500 flex items-center justify-center"></div>
             <span className="text-[9px] text-zinc-400">{opt}</span>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

const MessageCard = ({ name, topic, tag, body, icon = "bg-[#ec4899]" }) => (
  <div className="bg-[#18181b] rounded-xl p-4 border border-white/5 flex flex-col shadow-md">
    <div className="flex items-center justify-between mb-3">
      <div className="flex gap-3">
         <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
            <span className={`w-full h-full ${icon} opacity-80 flex items-center justify-center text-white text-xs font-bold`}>
              {name.charAt(0)}
            </span>
         </div>
         <div>
            <h5 className="text-[13px] text-white font-medium">{name}</h5>
            <p className="text-[10px] text-zinc-400">{topic}</p>
         </div>
      </div>
      <span className="text-[9px] text-zinc-300 font-medium bg-white/10 px-2 py-0.5 rounded-full border border-white/10 shadow-sm">{tag}</span>
    </div>
    <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
      {body}
    </p>
    <div className="flex gap-2">
       <input type="text" placeholder="Acknowledge..." className="flex-1 bg-[#27272a] border border-white/5 rounded-md px-3 py-1.5 text-[11px] text-white outline-none focus:border-white/20" />
       <button className="bg-white/10 hover:bg-white/20 rounded-md p-1.5 transition">
         <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300" />
       </button>
    </div>
  </div>
);
