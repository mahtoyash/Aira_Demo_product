import React from 'react';
import { Marquee } from './ui/marquee';
import { Settings, Cpu, HardDrive, Wifi, Shield } from 'lucide-react';

const specsItems = [
  {
    image: "./specs-image-1.jpeg",
    name: "Aether Sensor Array",
    role: "Core Environmental Scanner",
  },
  {
    image: "./specs-image-2.jpeg",
    name: "Air Flow Module",
    role: "Precision VOC detection",
  },
  {
    image: "./specs-image-3.jpeg",
    name: "Smart Hub Controller",
    role: "Central Processing Unit",
  },
  {
    image: "./specs-image-1.jpeg",
    name: "Aether Sensor Array",
    role: "Core Environmental Scanner (Node 2)",
  },
  {
    image: "./specs-image-2.jpeg",
    name: "Air Flow Module",
    role: "Precision VOC detection (Node 2)",
  },
  {
    image: "./specs-image-3.jpeg",
    name: "Smart Hub Controller",
    role: "Central Processing Unit (Node 2)",
  },
];

export default function PhysicalSpecsSection() {
  return (
    <section id="specs" className="relative w-full overflow-hidden bg-white py-12 md:py-24 font-[family-name:var(--font-geist)]">
      <div>
        <svg
          className="absolute right-0 bottom-0 text-gray-200"
          fill="none"
          height="154"
          viewBox="0 0 460 154"
          width="460"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_494_1104)">
            <path
              d="M-87.463 458.432C-102.118 348.092 -77.3418 238.841 -15.0744 188.274C57.4129 129.408 180.708 150.071 351.748 341.128C278.246 -374.233 633.954 380.602 548.123 42.7707"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="40"
            />
          </g>
          <defs>
            <clipPath id="clip0_494_1104">
              <rect fill="white" height="154" width="460" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto mb-16 flex max-w-5xl flex-col items-center px-6 text-center lg:px-0">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"/><path d="M8 15H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/></svg>
          </div>

          <h1 className="relative mb-4 font-semibold text-5xl md:text-[64px] tracking-tight text-gray-900 drop-shadow-sm">
            Physical Specifications
            <svg
              className="absolute -top-4 -right-12 -z-10 w-24 md:w-32 text-gray-100"
              fill="currentColor"
              height="86"
              viewBox="0 0 108 86"
              width="108"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M38.8484 16.236L15 43.5793L78.2688 15L18.1218 71L93 34.1172L70.2047 65.2739"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="28"
              />
            </svg>
          </h1>
          <p className="max-w-2xl text-gray-600 text-lg my-4">
            Discover the high-end hardware powering Aether's unrivaled indoor air quality forecasting.
          </p>
        </div>

        <div className="relative w-full my-12">
          {/* Gradient fade borders */}
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-32 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-32 bg-gradient-to-l from-white to-transparent" />

          <Marquee className="[--gap:1.5rem]" pauseOnHover>
            {specsItems.map((item) => (
              <div
                className="group flex w-[350px] shrink-0 flex-col"
                key={item.name}
              >
                <div className="relative h-[400px] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-md">
                  <img
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={item.image}
                  />
                  <div className="absolute inset-x-4 bottom-4 rounded-xl bg-white/80 backdrop-blur-md p-4 shadow-sm border border-white/40">
                    <h3 className="font-semibold text-lg text-gray-900 tracking-tight">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {item.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>


      </div>
    </section>
  );
}
