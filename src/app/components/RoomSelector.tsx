import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Database } from 'lucide-react';

interface RoomSelectorProps {
  rooms: string[];
  selectedRoom: string;
  setSelectedRoom: (r: string) => void;
  handleAddRoom: (name: string) => Promise<void>;
}

export function RoomSelector({ rooms, selectedRoom, setSelectedRoom, handleAddRoom }: RoomSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onAddRoom = async () => {
    if (newRoomName.trim()) {
      await handleAddRoom(newRoomName.trim());
      setNewRoomName('');
      setIsAdding(false);
      setIsOpen(false);
    }
  };

  const displayName = selectedRoom || 'Default';

  return (
    <div className="relative inline-block ml-3 align-middle" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] text-[var(--dash-text)] text-sm font-medium transition-all"
      >
        <span className="text-[var(--dash-text-muted)] font-normal mr-1">Room:</span>
        <span>{displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--dash-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-black/40 border border-[var(--dash-card-border)] rounded-xl shadow-[inset_0_0.5px_0_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden text-sm backdrop-blur-[24px]">
          <div className="py-1.5">
            {/* Default option - reads from /readings */}
            <button
              onClick={() => { setSelectedRoom(''); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-white/10 transition-colors ${!selectedRoom ? 'text-[var(--dash-violet)] bg-white/5' : 'text-[var(--dash-text-muted)]'}`}
            >
              <span className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                Default (readings)
              </span>
              {!selectedRoom && <Check className="w-4 h-4" />}
            </button>

            {rooms.length > 0 && <div className="border-t border-[#475569]/30 my-1"></div>}

            {rooms.map(room => (
              <button
                key={room}
                onClick={() => { setSelectedRoom(room); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-white/10 transition-colors ${selectedRoom === room ? 'text-[var(--dash-violet)] bg-white/5' : 'text-[var(--dash-text)]'}`}
              >
                {room}
                {selectedRoom === room && <Check className="w-4 h-4" />}
              </button>
            ))}
            
            <div className="border-t border-[#475569]/50 my-1.5"></div>
            
            {isAdding ? (
              <div className="px-2 pb-1 flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onAddRoom()}
                  placeholder="Room name..."
                  className="w-full bg-black/50 border border-[#475569]/50 rounded-lg px-2.5 py-1.5 text-[var(--dash-text)] text-sm outline-none focus:border-[#A855F7] transition-colors"
                />
                <button 
                  onClick={onAddRoom}
                  className="text-xs bg-[#A855F7] text-white px-3 py-1.5 rounded-lg hover:bg-[#9333EA] transition-colors font-medium shadow"
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full text-left px-3 py-2 flex items-center gap-2 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add room
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}