import MapViewComponent, { type ComplaintLocation } from '../MapView';

type AuthorityMapProps = {
  locations: ComplaintLocation[];
  onLocationPress?: (location: ComplaintLocation) => void;
};

export default function AuthorityMap({ locations, onLocationPress }: AuthorityMapProps) {
  return (
    <MapViewComponent
      locations={locations}
      onLocationPress={onLocationPress}
    />
  );
}
