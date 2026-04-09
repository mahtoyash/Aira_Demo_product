import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import DynamicDifference from "./ui/DynamicDifference";

const environments = [
  {
    title: "Offices & Workspaces",
    desc: "Cognitive Performance",
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
  },
  {
    title: "Schools & Classrooms",
    desc: "Student Focus & Health",
    src: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&q=80",
  },
  {
    title: "Hospitals & Clinics",
    desc: "Infection Control",
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
  },
  {
    title: "Smart Homes",
    desc: "Family Well-being",
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  },
];

export default function DifferencesSection() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const lerp = (start, end, factor) => {
      return start + (end - start) * factor;
    };

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePosition]);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setIsVisible(false);
  };

  return (
    <div className="py-24 md:py-32 overflow-hidden bg-zinc-50 text-[#1a1a1a] relative z-40 transition-colors duration-1000">
      {/* Background gradient transition from previous section's light color ending into this dark one */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fdfbf7] md:from-white/0 to-transparent opacity-10 pointer-events-none" />

      <div className="mx-auto max-w-[100rem] px-6 md:px-12 lg:px-20">
        <div className="flex flex-col items-center justify-center text-center w-full mb-24 md:mb-32">
          <h2 className="text-4xl sm:text-5xl md:text-[80px] lg:text-[105px] font-sans font-bold tracking-tight leading-[1.1] w-full max-w-7xl pb-4">
            Where Does Better Air Make A <DynamicDifference />
          </h2>
        </div>

        <section ref={containerRef} onMouseMove={handleMouseMove} className="relative w-full max-w-5xl mx-auto">
          {/* Floating Preview Window */}
          <div
            className="pointer-events-none fixed z-50 overflow-hidden rounded-xl shadow-2xl hidden md:block"
            style={{
              left: containerRef.current?.getBoundingClientRect().left ?? 0,
              top: containerRef.current?.getBoundingClientRect().top ?? 0,
              transform: `translate3d(${smoothPosition.x + 40}px, ${smoothPosition.y - 120}px, 0)`,
              opacity: isVisible ? 1 : 0,
              scale: isVisible ? 1 : 0.8,
              transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="relative w-[400px] h-[280px] bg-zinc-200 rounded-xl overflow-hidden shadow-inner">
              {environments.map((env, index) => (
                <img
                  key={env.title}
                  src={env.src}
                  alt={env.title}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out"
                  style={{
                    opacity: hoveredIndex === index ? 1 : 0,
                    scale: hoveredIndex === index ? 1 : 1.1,
                    filter: hoveredIndex === index ? "none" : "blur(10px)",
                  }}
                />
              ))}
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="space-y-0 relative z-10 w-full">
            {environments.map((env, index) => (
              <div
                key={env.title}
                className="group block cursor-default"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="relative py-8 md:py-14 border-t border-zinc-300 transition-all duration-300 ease-out">
                  {/* Background highlight on hover */}
                  <div
                    className={`
                      absolute inset-0 -mx-6 px-6 bg-zinc-100/80 rounded-[2rem]
                      transition-all duration-300 ease-out
                      ${hoveredIndex === index ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}
                    `}
                  />

                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-4">
                        <h3 className="text-black font-semibold text-2xl sm:text-3xl md:text-5xl lg:text-6xl tracking-tight">
                          <span className="relative inline-block">
                            {env.title}
                            <span
                              className={`
                                absolute left-0 bottom-1 h-[3px] bg-zinc-300
                                transition-all duration-500 ease-out
                                ${hoveredIndex === index ? "w-full" : "w-0"}
                              `}
                            />
                          </span>
                        </h3>

                        <ArrowUpRight
                          className={`
                            w-10 h-10 text-zinc-400
                            transition-all duration-500 ease-out
                            ${
                              hoveredIndex === index
                                ? "opacity-100 translate-x-0 translate-y-0 text-zinc-600"
                                : "opacity-0 -translate-x-6 translate-y-6"
                            }
                          `}
                        />
                      </div>

                      <p
                        className={`
                          text-xl md:text-2xl mt-4 leading-relaxed font-light
                          transition-all duration-300 ease-out
                          ${hoveredIndex === index ? "text-zinc-600" : "text-zinc-400"}
                        `}
                      >
                        {env.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t border-zinc-300" />
          </div>
        </section>
      </div>
    </div>
  );
}
