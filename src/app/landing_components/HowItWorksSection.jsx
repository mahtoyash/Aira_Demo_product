import React, { useState, useEffect } from "react";
import { AreaChart, Area, Grid, XAxis, ChartTooltip } from "./ui/area-chart";
import InteractiveDashboard from "./InteractiveDashboard";
import TypewriterText from "./TypewriterText";

const generateCO2Data = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    // Base CO2 is 400 + random variation
    const baseToday = 450 + Math.sin(i / 3) * 200 + Math.random() * 100;
    const baseYesterday = 500 + Math.cos(i / 3) * 250 + Math.random() * 120;
    
    data.push({
      date: time,
      today: Math.max(400, Math.round(baseToday)),
      yesterday: Math.max(400, Math.round(baseYesterday))
    });
  }
  return data;
};

export default function HowItWorksSection() {
  const [data, setData] = useState([]);

  useEffect(() => {
    setData(generateCO2Data());
  }, []);

  return (
    <section className="relative w-full py-32 bg-zinc-50 flex flex-col items-center">
      <div className="mx-auto max-w-7xl px-6 md:px-12 w-full">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center w-full mb-16">
          <h2 className="text-5xl sm:text-6xl md:text-[76px] lg:text-[96px] font-semibold tracking-[-0.03em] text-black mb-6 drop-shadow-sm leading-none">
            How it works
          </h2>
          <p className="max-w-2xl text-lg text-zinc-600">
            Aira visualizes the invisible. Track realtime toxic buildup against historical benchmarks perfectly synced from every sensor node.
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="w-full max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-br from-zinc-200 to-zinc-300/30 shadow-[0_0_100px_-20px_rgba(236,72,153,0.4)] relative">
          {/* Inner Dashboard Wrapper */}
          <div className="bg-white rounded-[22px] w-full p-3 sm:p-5 md:p-8 flex flex-col gap-4 sm:gap-8 min-h-[400px] sm:h-[600px] overflow-hidden">
            {/* Nav / Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-lg">Boardroom Alpha</h3>
                  <p className="text-xs text-zinc-500 font-medium">REAL-TIME CO2 TELEMETRY</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-semibold rounded-full">YESTERDAY</span>
                <span className="px-3 py-1 bg-pink-50 text-pink-500 text-xs font-semibold rounded-full">TODAY</span>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0 relative isolate mt-8">
              {data.length > 0 && (
                <AreaChart data={data} xDataKey="date">
                  <Grid horizontal vertical={false} />
                  <Area
                    dataKey="yesterday"
                    fill="var(--chart-line-secondary)"
                    stroke="var(--chart-line-secondary)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="4,4"
                  />
                  <Area
                    dataKey="today"
                    fill="#fbcfe8"
                    stroke="#ec4899"
                    fillOpacity={0.2}
                    strokeWidth={3}
                    fadeEdges
                  />
                  <XAxis numTicks={6} />
                  <ChartTooltip
                    rows={(point) => [
                      {
                        color: "#ec4899",
                        label: "Today",
                        value: `${point.today} ppm`,
                      },
                      {
                        color: "var(--chart-line-secondary)",
                        label: "Yesterday",
                        value: `${point.yesterday} ppm`,
                      },
                    ]}
                  />
                </AreaChart>
              )}
            </div>
          </div>
        </div>

        <div id="features" className="scroll-mt-[40vh] mt-48 mb-6 w-full flex justify-center text-center z-20 relative px-4">
          <TypewriterText 
            text="Everything Important For You" 
            className="text-4xl sm:text-5xl md:text-[55px] lg:text-[84px] leading-[1.1] font-bold tracking-[-0.03em] text-black drop-shadow-sm font-[family-name:var(--font-geist)] whitespace-normal lg:whitespace-nowrap"
          />
        </div>

        {/* Interactive Dashboard Addition */}
        <InteractiveDashboard />
      </div>
    </section>
  );
}
