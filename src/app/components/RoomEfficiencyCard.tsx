import { Activity } from 'lucide-react';
import { StatCard } from './StatCard';

interface RoomEfficiencyCardProps {
  co2?: number;
  occupancy?: number;
  plants?: number;
  ventilation?: number; 
}

export function RoomEfficiencyCard({
  co2 = 412,
  occupancy = 5,
  plants = 3,
  ventilation = 4
}: RoomEfficiencyCardProps) {
  
  // Calculate efficiency percentage based on multiple factors
  let eff = 100;
  
  // 1. CO2 Penalty (Ideal is <=400ppm. Every 10ppm above 400 reduces efficiency by 1%)
  const co2Penalty = Math.max(0, (co2 - 400) / 10);
  eff -= co2Penalty;
  
  // 2. Ventilation & Occupancy Penalty
  // High occupancy with low ventilation drastically reduces air quality.
  // Assuming 'ventilation' is a generic score or Air Changes per Hour (ACH).
  const ventPerPerson = occupancy > 0 ? ventilation / occupancy : ventilation;
  if (ventPerPerson < 1) {
    eff -= (1 - ventPerPerson) * 20; 
  }

  // 3. Plant Bonus (Plants improve air quality and psychological efficiency)
  eff += Math.min(plants * 2, 10); // Max 10% bonus from plants

  // Ensure it stays between 0 and 100
  const finalEfficiency = Math.max(0, Math.min(100, Math.round(eff)));

  return (
    <StatCard
      title="Room Efficiency"
      value={`${finalEfficiency}%`}
      icon={Activity}
      showMeter={true}
      meterValue={finalEfficiency}
      maxMeterValue={100}
      invertMeterColors={true}
    />
  );
}