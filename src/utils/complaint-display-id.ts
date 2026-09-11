export function formatComplaintDisplayId(sequence: number): string {
  const normalizedSequence = Math.max(1, Math.trunc(sequence));
  return `CMP-${String(normalizedSequence).padStart(2, '0')}`;
}
