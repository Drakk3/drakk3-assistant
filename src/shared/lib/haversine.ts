interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceMeters(origin: GeoPoint, destination: GeoPoint): number {
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversineComponent =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversineComponent), Math.sqrt(1 - haversineComponent));

  return EARTH_RADIUS_METERS * angularDistance;
}
