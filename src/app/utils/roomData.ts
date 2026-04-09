export function getRoomData(roomName: string) {
  if (!roomName) return { co2: 400, occupancy: 0, plants: 0, humidity: 40, temperature: 20 };
  let hash = 0;
  for (let i = 0; i < roomName.length; i++) hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
  
  let seed = Math.abs(hash);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const co2 = Math.floor(400 + random() * 450); // 400-850 ppm
  const occupancy = Math.floor(2 + random() * 20); // 2-22 people
  const plants = Math.floor(1 + random() * 8); // 1-9 plants
  const humidity = Math.floor(30 + random() * 30); // 30-60 %
  const temperature = Math.floor(18 + random() * 10); // 18-28 C
  
  return { co2, occupancy, plants, humidity, temperature, ventilation: 4 };
}
