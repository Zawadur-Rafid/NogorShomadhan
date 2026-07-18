import MapViewComponent, { type ComplaintLocation } from '../MapView';

type AuthorityMapProps = {
  locations: ComplaintLocation[];
};

export default function AuthorityMap({ locations }: AuthorityMapProps) {
  return <MapViewComponent locations={locations} />;
}
