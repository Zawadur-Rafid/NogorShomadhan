// src/utils/formatters.ts
export function formatLocation(data: { house?: string; road?: string; avenue?: string; nearby_landmark?: string; additional_location_details?: string }) {
  const parts = [];
  if (data.house) parts.push(`House ${data.house}`);
  if (data.road) parts.push(`Road ${data.road}`);
  if (data.avenue) parts.push(`Avenue ${data.avenue}`);
  if (data.nearby_landmark) parts.push(data.nearby_landmark);
  if (data.additional_location_details) parts.push(data.additional_location_details);
  
  return parts.length > 0 ? parts.join(', ') : 'Location not provided';
}
