import React, { useState } from 'react';
import { FaLinkedinIn, FaTwitter, FaBehance, FaInstagram } from 'react-icons/fa';
import { cn } from '../landing_lib/utils';

const DEFAULT_MEMBERS = [
  {
    id: '1',
    name: 'Sanskar Ghorpade',
    role: 'Hardware',
    image: import.meta.env.BASE_URL + 'team-3.jpeg',
    social: { twitter: '#', linkedin: '#', behance: '#' },
  },
  {
    id: '2',
    name: 'Yash Mahto',
    role: 'Software',
    image: import.meta.env.BASE_URL + 'team-2.jpeg',
    social: { twitter: '#', linkedin: '#' },
  },
  {
    id: '3',
    name: 'Piyush Zanje',
    role: 'Aether Forecaster',
    image: import.meta.env.BASE_URL + 'team-1.jpeg',
    social: { twitter: '#', linkedin: '#' },
  },
];

export default function TeamShowcase({ members = DEFAULT_MEMBERS }) {
  const [hoveredId, setHoveredId] = useState(null);

  const col1 = members.filter((_, i) => i % 3 === 0);
  const col2 = members.filter((_, i) => i % 3 === 1);
  const col3 = members.filter((_, i) => i % 3 === 2);

  return (
    <section id="team" className="relative w-full bg-white py-12 md:py-24 font-[family-name:var(--font-geist)]">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10 lg:gap-14 select-none w-full max-w-5xl mx-auto py-8 px-4 md:px-6">
        
        {/* ── Left: photo grid ── */}
        <div className="flex gap-2 md:gap-3 flex-shrink-0 overflow-x-auto pb-1 md:pb-0 justify-center w-full md:w-auto">
          {/* Column 1 */}
          <div className="flex flex-col gap-2 md:gap-3">
            {col1.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                className="w-[110px] h-[120px] sm:w-[130px] sm:h-[140px] md:w-[155px] md:h-[165px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-2 md:gap-3 mt-[48px] sm:mt-[56px] md:mt-[68px]">
            {col2.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                className="w-[122px] h-[132px] sm:w-[145px] sm:h-[155px] md:w-[172px] md:h-[182px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-2 md:gap-3 mt-[22px] sm:mt-[26px] md:mt-[32px]">
            {col3.map((member) => (
              <PhotoCard
                key={member.id}
                member={member}
                className="w-[115px] h-[125px] sm:w-[136px] sm:h-[146px] md:w-[162px] md:h-[172px]"
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            ))}
          </div>
        </div>

        {/* ── Right: member name list*/}
        <div className="flex flex-col sm:grid sm:grid-cols-2 md:flex md:flex-col gap-4 md:gap-5 pt-0 md:pt-2 flex-1 w-full mt-8 md:mt-0">
          <div className="mb-4">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 drop-shadow-sm pb-2">Meet the Team</h2>
            <p className="text-gray-500 text-lg">The minds behind perfectly calibrated indoor environments.</p>
          </div>
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              hoveredId={hoveredId}
              onHover={setHoveredId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PhotoCard({
  member,
  className,
  hoveredId,
  onHover,
}) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl cursor-pointer flex-shrink-0 transition-opacity duration-500',
        className,
        isDimmed ? 'opacity-60' : 'opacity-100',
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <img
        src={member.image}
        alt={member.name}
        className="w-full h-full object-cover transition-[filter] duration-500"
        style={{
          filter: isActive ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.77)',
        }}
      />
    </div>
  );
}

function MemberRow({
  member,
  hoveredId,
  onHover,
}) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;
  const hasSocial = member.social?.twitter ?? member.social?.linkedin ?? member.social?.instagram ?? member.social?.behance;

  return (
    <div
      className={cn(
        'cursor-pointer transition-opacity duration-300',
        isDimmed ? 'opacity-50' : 'opacity-100',
      )}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'w-4 h-3 rounded-[5px] flex-shrink-0 transition-all duration-300',
            isActive ? 'bg-black w-5' : 'bg-black/20',
          )}
        />
        <span
          className={cn(
            'text-base md:text-[18px] font-semibold leading-none tracking-tight transition-colors duration-300',
            isActive ? 'text-black' : 'text-gray-600',
          )}
        >
          {member.name}
        </span>

        {hasSocial && (
          <div
            className={cn(
              'flex items-center gap-1.5 ml-0.5 transition-all duration-200',
              isActive
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-2 pointer-events-none',
            )}
          >
            {member.social?.twitter && (
              <a href={member.social.twitter} onClick={(e) => e.stopPropagation()} className="p-1 rounded text-gray-400 hover:text-black transition-all hover:scale-110">
                <FaTwitter size={14} />
              </a>
            )}
            {member.social?.linkedin && (
              <a href={member.social.linkedin} onClick={(e) => e.stopPropagation()} className="p-1 rounded text-gray-400 hover:text-black transition-all hover:scale-110">
                <FaLinkedinIn size={14} />
              </a>
            )}
            {member.social?.instagram && (
              <a href={member.social.instagram} onClick={(e) => e.stopPropagation()} className="p-1 rounded text-gray-400 hover:text-black transition-all hover:scale-110">
                <FaInstagram size={14} />
              </a>
            )}
            {member.social?.behance && (
              <a href={member.social.behance} onClick={(e) => e.stopPropagation()} className="p-1 rounded text-gray-400 hover:text-black transition-all hover:scale-110">
                <FaBehance size={14} />
              </a>
            )}
          </div>
        )}
      </div>
      <p className="mt-1.5 pl-[27px] text-[9px] md:text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
        {member.role}
      </p>
    </div>
  );
}
