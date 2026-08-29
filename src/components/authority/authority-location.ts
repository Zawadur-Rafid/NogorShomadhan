import type { AuthorityComplaint } from './store-authority-dashboard';

export type AuthorityLocationFields = Pick<
  AuthorityComplaint,
  | 'house'
  | 'road'
  | 'avenue'
  | 'nearby_landmark'
  | 'additional_location_details'
>;

export type AuthorityLocationDetail = {
  key: keyof AuthorityLocationFields;
  label: string;
  value: string;
};

const clean = (value?: string) => value?.trim() ?? '';

function withPrefix(value: string, prefix: string, aliases: string[]) {
  if (!value) return '';

  const alreadyPrefixed = aliases.some((alias) =>
    value.toLowerCase().startsWith(alias.toLowerCase()),
  );

  return alreadyPrefixed ? value : `${prefix} ${value}`;
}

export function getAuthorityLocationDetails(
  complaint: AuthorityLocationFields,
): AuthorityLocationDetail[] {
  return [
    { key: 'house', label: 'House Number', value: clean(complaint.house) },
    { key: 'road', label: 'Road Number', value: clean(complaint.road) },
    { key: 'avenue', label: 'Avenue', value: clean(complaint.avenue) },
    {
      key: 'nearby_landmark',
      label: 'Nearby Landmark',
      value: clean(complaint.nearby_landmark),
    },
    {
      key: 'additional_location_details',
      label: 'Additional Details',
      value: clean(complaint.additional_location_details),
    },
  ];
}

export function formatAuthorityAddress(
  complaint: AuthorityLocationFields,
): string {
  const parts = [
    withPrefix(clean(complaint.house), 'House', ['house', 'holding']),
    withPrefix(clean(complaint.road), 'Road', ['road', 'rd']),
    withPrefix(clean(complaint.avenue), 'Avenue', ['avenue', 'ave']),
    clean(complaint.nearby_landmark),
    clean(complaint.additional_location_details),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Location not provided';
}

export function buildAuthorityGeocodingQueries(
  complaint: AuthorityLocationFields,
): string[] {
  const house = withPrefix(clean(complaint.house), 'House', ['house', 'holding']);
  const road = withPrefix(clean(complaint.road), 'Road', ['road', 'rd']);
  const avenue = withPrefix(clean(complaint.avenue), 'Avenue', ['avenue', 'ave']);
  const landmark = clean(complaint.nearby_landmark);
  const additional = clean(complaint.additional_location_details);
  const configuredArea = process.env.EXPO_PUBLIC_AUTHORITY_MAP_AREA?.trim();
  const areaParts = [configuredArea, 'Bangladesh'].filter(Boolean);

  const candidates = [
    [house, road, avenue, landmark, additional, ...areaParts],
    [road, avenue, landmark, additional, ...areaParts],
    [landmark, additional, ...areaParts],
  ]
    .map((parts) => parts.filter(Boolean).join(', '))
    .filter((value) => value && value !== 'Bangladesh');

  return Array.from(new Set(candidates));
}

export function getAuthorityAreaLabel(
  complaint: AuthorityLocationFields,
): string {
  const avenue = clean(complaint.avenue);
  if (avenue) return withPrefix(avenue, 'Avenue', ['avenue', 'ave']);

  const road = clean(complaint.road);
  if (road) return withPrefix(road, 'Road', ['road', 'rd']);

  return (
    clean(complaint.nearby_landmark) ||
    clean(complaint.additional_location_details) ||
    'Location not provided'
  );
}
