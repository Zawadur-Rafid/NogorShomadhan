import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Callout, Marker, type LatLng } from 'react-native-maps';

import {
  ensureAuthorityGeocodingPermission,
  geocodeAuthorityComplaint,
  type AuthorityGeocodeResult,
} from '@/services/authority-geocoding.service';

import type { AuthorityIssueMapProps } from './authority-map.types';

type MapPoint = AuthorityGeocodeResult & {
  id: string;
  title: string;
  location: string;
  status: AuthorityIssueMapProps['complaints'][number]['status'];
};

const statusPinColors = {
  PENDING: '#EF4444',
  'IN PROGRESS': '#C67B00',
  RESOLVED: '#2563EB',
} as const;

const defaultRegion = {
  latitude: 23.685,
  longitude: 90.3563,
  latitudeDelta: 6.5,
  longitudeDelta: 6.5,
};

export default function AuthorityIssueMap({
  complaints,
  selectedComplaintId,
  onComplaintPress,
  height = 330,
}: AuthorityIssueMapProps) {
  const mapRef = useRef<MapView>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const complaintKey = useMemo(
    () =>
      complaints
        .map(
          (complaint) =>
            `${complaint.id}:${complaint.house ?? ''}:${complaint.road ?? ''}:${complaint.avenue ?? ''}:${complaint.nearby_landmark ?? ''}:${complaint.additional_location_details ?? ''}`,
        )
        .join('|'),
    [complaints],
  );

  useEffect(() => {
    let active = true;

    const loadPoints = async () => {
      setLoading(true);
      setMessage(null);

      try {
        const permissionGranted = await ensureAuthorityGeocodingPermission();
        if (!permissionGranted) {
          if (active) {
            setPoints([]);
            setMessage(
              'Location permission is required on Android to convert complaint addresses into map pins.',
            );
          }
          return;
        }

        const nextPoints: MapPoint[] = [];

        for (const complaint of complaints) {
          if (!active) return;

          const result = await geocodeAuthorityComplaint(complaint);
          if (!result) continue;

          nextPoints.push({
            ...result,
            id: complaint.id,
            title: complaint.title,
            location: complaint.location,
            status: complaint.status,
          });
        }

        if (!active) return;

        setPoints(nextPoints);
        const missingCount = complaints.length - nextPoints.length;
        setMessage(
          missingCount > 0
            ? `${missingCount} complaint ${missingCount === 1 ? 'address could' : 'addresses could'} not be pinpointed.`
            : null,
        );
      } catch {
        if (active) {
          setPoints([]);
          setMessage('The complaint map could not load. Check the connection and try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPoints();
    return () => {
      active = false;
    };
  }, [complaintKey, complaints, reloadToken]);

  useEffect(() => {
    if (points.length === 0) return;

    const selectedPoint = points.find(
      (point) => point.id === selectedComplaintId,
    );

    const timer = setTimeout(() => {
      if (selectedPoint) {
        mapRef.current?.animateToRegion(
          {
            latitude: selectedPoint.latitude,
            longitude: selectedPoint.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          },
          450,
        );
        return;
      }

      mapRef.current?.fitToCoordinates(
        points.map(
          (point): LatLng => ({
            latitude: point.latitude,
            longitude: point.longitude,
          }),
        ),
        {
          animated: true,
          edgePadding: { top: 54, right: 54, bottom: 74, left: 54 },
        },
      );
    }, 150);

    return () => clearTimeout(timer);
  }, [points, selectedComplaintId]);

  if (loading) {
    return (
      <View style={[styles.stateCard, { height }]}>
        <ActivityIndicator size="large" color="#23435D" />
        <Text style={styles.stateTitle}>Pinpointing complaint locations</Text>
        <Text style={styles.stateText}>
          Converting the resident-provided address details into map pins...
        </Text>
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={[styles.stateCard, { height }]}>
        <Ionicons name="map-outline" size={34} color="#7A8493" />
        <Text style={styles.stateTitle}>No map pins available</Text>
        <Text selectable style={styles.stateText}>
          {message ?? 'No complaint contains enough location information.'}
        </Text>
        <Pressable
          onPress={() => setReloadToken((current) => current + 1)}
          style={styles.retryButton}
        >
          <Ionicons name="refresh-outline" size={15} color="#FFFFFF" />
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        accessibilityLabel="Authority complaint map"
        initialRegion={defaultRegion}
        loadingEnabled
        mapType="standard"
        rotateEnabled={false}
        style={StyleSheet.absoluteFill}
      >
        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            identifier={point.id}
            pinColor={statusPinColors[point.status]}
            title={point.title}
          >
            <Callout
              onPress={() => onComplaintPress?.(point.id)}
              tooltip={false}
            >
              <View style={styles.callout}>
                <Text style={styles.calloutStatus}>{point.status}</Text>
                <Text style={styles.calloutTitle}>{point.title}</Text>
                <Text style={styles.calloutAddress}>{point.location}</Text>
                {onComplaintPress && (
                  <Text style={styles.calloutLink}>Open complaint</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {message && (
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={14} color="#23435D" />
          <Text style={styles.noticeText}>{message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#E8EDF4',
  },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 24,
    borderRadius: 14,
    backgroundColor: '#EEF2F5',
  },
  stateTitle: { color: '#253244', fontSize: 14, fontWeight: '800' },
  stateText: {
    maxWidth: 340,
    color: '#6B7280',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#23435D',
  },
  retryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  notice: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  noticeText: { flex: 1, color: '#52606D', fontSize: 9, fontWeight: '600' },
  callout: { width: 220, gap: 4, paddingVertical: 3 },
  calloutStatus: { color: '#6B7280', fontSize: 8, fontWeight: '800' },
  calloutTitle: { color: '#1F2937', fontSize: 12, fontWeight: '800' },
  calloutAddress: { color: '#667085', fontSize: 9, lineHeight: 14 },
  calloutLink: { color: '#2563EB', fontSize: 9, fontWeight: '800', marginTop: 3 },
});
