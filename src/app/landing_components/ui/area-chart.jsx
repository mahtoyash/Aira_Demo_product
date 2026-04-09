"use client";
import React, { Children, createContext, isValidElement, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { localPoint } from "@visx/event";
import { curveMonotoneX } from "@visx/curve";
import { GridRows, GridColumns } from "@visx/grid";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { bisector } from "d3-array";
import { AnimatePresence, motion, useMotionTemplate, useSpring } from "framer-motion";
import useMeasure from "react-use-measure";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) { return twMerge(clsx(inputs)); }

export const chartCssVars = {
  background: "var(--chart-background)",
  foreground: "var(--chart-foreground)",
  foregroundMuted: "var(--chart-foreground-muted)",
  label: "var(--chart-label)",
  linePrimary: "var(--chart-line-primary)",
  lineSecondary: "var(--chart-line-secondary)",
  crosshair: "var(--chart-crosshair)",
  grid: "var(--chart-grid)",
};

const ChartContext = createContext(null);
function ChartProvider({ children, value }) { return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>; }
function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within ChartProvider.");
  return ctx;
}

function useChartInteraction({ xScale, yScale, data, lines, margin, xAccessor, bisectDate, canInteract }) {
  const [tooltipData, setTooltipData] = useState(null);
  const [selection, setSelection] = useState(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);

  const resolveTooltipFromX = useCallback((pixelX) => {
    const x0 = xScale.invert(pixelX);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    if (!d0) return null;
    let d = d0;
    let finalIndex = index - 1;
    if (d1) {
      if (x0.getTime() - xAccessor(d0).getTime() > xAccessor(d1).getTime() - x0.getTime()) {
        d = d1;
        finalIndex = index;
      }
    }
    const yPositions = {};
    for (const line of lines) {
      if (typeof d[line.dataKey] === "number") yPositions[line.dataKey] = yScale(d[line.dataKey]);
    }
    return { point: d, index: finalIndex, x: xScale(xAccessor(d)), yPositions };
  }, [xScale, yScale, data, lines, xAccessor, bisectDate]);

  const getChartX = useCallback((event) => {
    let point = null;
    if (event.touches) {
      if (!event.touches[0]) return null;
      point = localPoint(event.currentTarget.ownerSVGElement, event.touches[0]);
    } else {
      point = localPoint(event);
    }
    return point ? point.x - margin.left : null;
  }, [margin.left]);

  const handleMouseMove = useCallback((e) => {
    const chartX = getChartX(e);
    if (chartX === null) return;
    const tooltip = resolveTooltipFromX(chartX);
    if (tooltip) setTooltipData(tooltip);
  }, [getChartX, resolveTooltipFromX]);

  const handleMouseLeave = useCallback(() => { setTooltipData(null); }, []);
  return { tooltipData, setTooltipData, selection, clearSelection: () => setSelection(null), interactionHandlers: canInteract ? { onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave } : {}, interactionStyle: { cursor: canInteract ? "crosshair" : "default", touchAction: "none" } };
}

function TooltipIndicator({ x, height, visible, width = "line", colorEdge = chartCssVars.crosshair, colorMid = chartCssVars.crosshair, fadeEdges = true }) {
  const pixelWidth = 1;
  const crosshairSpringConfig = { stiffness: 300, damping: 30 };
  const animatedX = useSpring(x - pixelWidth / 2, crosshairSpringConfig);
  useEffect(() => { animatedX.set(x - pixelWidth / 2); }, [x, animatedX, pixelWidth]);
  if (!visible) return null;
  return (
    <motion.rect fill={colorMid} opacity={0.5} height={height} width={pixelWidth} x={animatedX} y={0} />
  );
}

function TooltipDot({ x, y, visible, color, size = 5, strokeColor = chartCssVars.background, strokeWidth = 2 }) {
  const config = { stiffness: 300, damping: 30 };
  const animatedX = useSpring(x, config);
  const animatedY = useSpring(y, config);
  useEffect(() => { animatedX.set(x); animatedY.set(y); }, [x, y, animatedX, animatedY]);
  if (!visible) return null;
  return <motion.circle cx={animatedX} cy={animatedY} fill={color} r={size} stroke={strokeColor} strokeWidth={strokeWidth} />;
}

function TooltipBox({ x, y, visible, containerRef, containerWidth, containerHeight, offset = 16, className = "", children }) {
  const tooltipRef = useRef(null);
  const [tw, setTw] = useState(180);
  const [th, setTh] = useState(80);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      if (tooltipRef.current.offsetWidth > 0 && tooltipRef.current.offsetWidth !== tw) setTw(tooltipRef.current.offsetWidth);
      if (tooltipRef.current.offsetHeight > 0 && tooltipRef.current.offsetHeight !== th) setTh(tooltipRef.current.offsetHeight);
    }
  }, [tw, th]);

  const shouldFlipX = x + tw + offset > containerWidth;
  const targetX = shouldFlipX ? x - offset - tw : x + offset;
  const targetY = Math.max(offset, Math.min(y - th / 2, containerHeight - th - offset));

  const springConfig = { stiffness: 100, damping: 20 };
  const animatedLeft = useSpring(targetX, springConfig);
  const animatedTop = useSpring(targetY, springConfig);
  useEffect(() => { animatedLeft.set(targetX); }, [targetX, animatedLeft]);
  useEffect(() => { animatedTop.set(targetY); }, [targetY, animatedTop]);

  if (!(mounted && containerRef.current && visible)) return null;
  return createPortal(
    <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} exit={{ opacity: 0 }} className={cn("pointer-events-none absolute z-50", className)} ref={tooltipRef} style={{ left: animatedLeft, top: animatedTop }}>
      <div className="min-w-[140px] overflow-hidden rounded-xl bg-white shadow-xl border border-zinc-200 p-3">
        {children}
      </div>
    </motion.div>, containerRef.current
  );
}

export function ChartTooltip({ rows, children }) {
  const { tooltipData, width, height, innerHeight, margin, lines, xAccessor, containerRef } = useChart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const visible = tooltipData !== null;
  const x = tooltipData?.x ?? 0;
  const xWithMargin = x + margin.left;
  const yWithMargin = (tooltipData?.yPositions[lines[0]?.dataKey] ?? 0) + margin.top;
  const activeRows = rows && tooltipData ? rows(tooltipData.point) : [];

  if (!(mounted && containerRef.current)) return null;
  const content = (
    <>
      <svg className="pointer-events-none absolute inset-0" height="100%" width="100%">
        <g transform={`translate(${margin.left},${margin.top})`}>
          <TooltipIndicator height={innerHeight} visible={visible} x={x} />
          {visible && lines.map((line) => (
            <TooltipDot color={line.stroke} key={line.dataKey} visible={visible} x={x} y={tooltipData.yPositions[line.dataKey] ?? 0} />
          ))}
        </g>
      </svg>
      <TooltipBox containerHeight={height} containerRef={containerRef} containerWidth={width} visible={visible} x={xWithMargin} y={margin.top}>
        <div className="font-medium text-xs text-zinc-500 mb-2">
          {tooltipData ? xAccessor(tooltipData.point).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
        <div className="space-y-1.5">
          {activeRows.map(r => (
            <div key={r.label} className="flex justify-between gap-4 text-sm font-semibold text-zinc-800">
               <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: r.color}}/>{r.label}</div>
               <span>{r.value}</span>
            </div>
          ))}
        </div>
      </TooltipBox>
    </>
  );
  return createPortal(content, containerRef.current);
}

export function Grid({ horizontal = true, vertical = false }) {
  const { yScale, innerWidth, innerHeight } = useChart();
  return (
    <g className="chart-grid">
      {horizontal && <GridRows scale={yScale} stroke="var(--chart-grid)" strokeOpacity={0.5} strokeDasharray="4,4" width={innerWidth} />}
    </g>
  );
}

export function XAxis({ numTicks = 5 }) {
  const { xScale, margin, containerRef } = useChart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  const labels = useMemo(() => {
    const domain = xScale.domain();
    if (!domain[0] || !domain[1]) return [];
    const step = (domain[1].getTime() - domain[0].getTime()) / (numTicks - 1);
    return Array.from({length: numTicks}, (_, i) => {
      const d = new Date(domain[0].getTime() + step * i);
      return { x: margin.left + (xScale(d) || 0), label: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    });
  }, [xScale, numTicks, margin.left]);

  if (!(mounted && containerRef.current)) return null;
  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {labels.map(l => (
        <span key={l.x} className="absolute text-xs text-zinc-500" style={{left: l.x, bottom: 8, transform: 'translateX(-50%)'}}>{l.label}</span>
      ))}
    </div>,
    containerRef.current
  );
}

export function Area({ dataKey, fill, stroke, strokeWidth = 2, fillOpacity = 0.4, curve = curveMonotoneX, fadeEdges }) {
  const { data, xScale, yScale, innerHeight, innerWidth, tooltipData, isLoaded, animationDuration, xAccessor } = useChart();
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      if (len > 0) setPathLength(len);
    }
  }, [innerWidth, isLoaded]);

  const getY = useCallback((d) => yScale(d[dataKey] ?? 0), [dataKey, yScale]);
  const isHovering = tooltipData !== null;
  const gradientId = `area-grad-${dataKey}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g>
        <motion.g animate={{ opacity: isHovering ? 0.8 : 1 }} transition={{ duration: 0.3 }}>
          <AreaClosed curve={curve} data={data} fill={`url(#${gradientId})`} x={d => xScale(xAccessor(d)) ?? 0} y={getY} yScale={yScale} />
          <LinePath curve={curve} data={data} innerRef={pathRef} stroke={stroke || fill} strokeWidth={strokeWidth} x={d => xScale(xAccessor(d)) ?? 0} y={getY} strokeDasharray={strokeWidth===2 ? "4,4" : "none" /* simple heuristic from caller */} />
        </motion.g>
      </g>
    </>
  );
}

export function AreaChart({ data, xDataKey = "date", margin: marginProp, animationDuration = 1000, children, className = "" }) {
  const containerRef = useRef(null);
  const margin = { top: 20, right: 30, bottom: 40, left: 30, ...marginProp };

  return (
    <div className={cn("relative w-full h-full", className)} ref={containerRef}>
      <ParentSize debounceTime={10}>
        {({ width, height }) => {
          if (width < 50 || height < 50) return null;
          const innerWidth = width - margin.left - margin.right;
          const innerHeight = height - margin.top - margin.bottom;
          const xAccessor = (d) => new Date(d[xDataKey]);
          
          const maxTime = Math.max(...data.map(d=>xAccessor(d).getTime()));
          const minTime = Math.min(...data.map(d=>xAccessor(d).getTime()));
          const xScale = scaleTime({ range: [0, innerWidth], domain: [minTime, maxTime] });

          const lines = [];
          Children.forEach(children, child => {
            if (isValidElement(child) && child.props.dataKey) {
              lines.push({ dataKey: child.props.dataKey, stroke: child.props.stroke || child.props.fill });
            }
          });

          let maxValue = 0;
          lines.forEach(line => {
             data.forEach(d => { if (d[line.dataKey] > maxValue) maxValue = d[line.dataKey]; });
          });
          const yScale = scaleLinear({ range: [innerHeight, 0], domain: [0, maxValue * 1.1] });

          const bisectDate = bisector(xAccessor).left;
          return <ChartInner width={width} height={height} innerWidth={innerWidth} innerHeight={innerHeight} data={data} lines={lines} margin={margin} xScale={xScale} yScale={yScale} xAccessor={xAccessor} bisectDate={bisectDate} containerRef={containerRef} animationDuration={animationDuration} children={children} />
        }}
      </ParentSize>
    </div>
  );
}

function ChartInner({ width, height, innerWidth, innerHeight, data, lines, margin, xScale, yScale, xAccessor, bisectDate, containerRef, animationDuration, children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIsLoaded(true), 100); return () => clearTimeout(t); }, []);

  const { tooltipData, setTooltipData, selection, clearSelection, interactionHandlers, interactionStyle } = useChartInteraction({ xScale, yScale, data, lines, margin, xAccessor, bisectDate, canInteract: isLoaded });

  const ctx = { data, xScale, yScale, width, height, innerWidth, innerHeight, margin, tooltipData, setTooltipData, containerRef, lines, isLoaded, animationDuration, xAccessor };

  return (
    <ChartProvider value={ctx}>
      <svg width={width} height={height}>
        <g {...interactionHandlers} style={interactionStyle} transform={`translate(${margin.left},${margin.top})`}>
          <rect fill="transparent" x={0} y={0} width={innerWidth} height={innerHeight} />
          {children}
        </g>
      </svg>
    </ChartProvider>
  );
}
