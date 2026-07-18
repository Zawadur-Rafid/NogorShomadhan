import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityMap from '../../components/authority/authority-map';
import {
  authorityComplaints,
  authorityDashboardProfile,
  authorityDashboardStats,
  type AuthorityComplaint,
  type AuthorityComplaintStatus,
} from '../../components/authority/store-authority-dashboard';

const statusTheme: Record<AuthorityComplaintStatus, { color: string; background: string }> = {
  PENDING: { color: '#EF4444', background: '#FEF2F2' },
  'IN PROGRESS': { color: '#C67B00', background: '#FEF7E8' },
  RESOLVED: { color: '#2563EB', background: '#EFF6FF' },
};

export default function AuthorityDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [profileOpen, setProfileOpen] = useState(false);
  const wide = width >= 920;

  const priorityComplaints = useMemo(
    () => [...authorityComplaints].sort((first, second) => second.urgency - first.urgency),
    [],
  );

  const urgentCount = priorityComplaints.filter((complaint) => complaint.urgency >= 25).length;
  const urgencySignals = priorityComplaints.reduce((total, complaint) => total + complaint.urgency, 0);

  const openComplaint = (complaint: AuthorityComplaint) => {
    const folder =
      complaint.status === 'PENDING'
        ? 'pending'
        : complaint.status === 'IN PROGRESS'
          ? 'in-progress'
          : 'resolved';

    router.push(`/(authority)/complaints/${folder}/${complaint.id}` as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image source={require('../../../assets/images/main_logo.png')} style={styles.logoImage} />
          <View>
            <Text style={styles.logoText}>Nogor Shomadhan</Text>
            <Text style={styles.logoSubtitle}>Community Authority</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIcon} accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={21} color="#23435D" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileTrigger}
            onPress={() => setProfileOpen((current) => !current)}
          >
            <Ionicons name="person-circle" size={32} color="#23435D" />
            {wide && <Text style={styles.profileTriggerText}>{authorityDashboardProfile.name}</Text>}
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </TouchableOpacity>

          {profileOpen && (
            <View style={styles.profileMenu}>
              <Text style={styles.profileName}>{authorityDashboardProfile.name}</Text>
              <Text style={styles.profileMeta}>{authorityDashboardProfile.email}</Text>
              <Text style={styles.profileMeta}>{authorityDashboardProfile.role}</Text>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={18} color="#23435D" />
                <Text style={styles.menuItemText}>Profile information</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="lock-closed-outline" size={18} color="#23435D" />
                <Text style={styles.menuItemText}>Change password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="time-outline" size={18} color="#23435D" />
                <Text style={styles.menuItemText}>Activity log</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={() => router.replace('/sign-in' as never)}>
                <Ionicons name="log-out-outline" size={18} color="#DC4B42" />
                <Text style={[styles.menuItemText, styles.logoutText]}>Log out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.smallTitle}>COMMUNITY AUTHORITY</Text>
              <Text style={styles.bigTitle}>Welcome back, {authorityDashboardProfile.name}</Text>
              <Text style={styles.welcomeText}>Review assigned issues and act on the most urgent complaints first.</Text>
            </View>
            <TouchableOpacity
              style={styles.allComplaintsButton}
              onPress={() => router.push('/authority/complaints' as never)}
            >
              <Ionicons name="documents-outline" size={18} color="#FFFFFF" />
              <Text style={styles.allComplaintsButtonText}>All Complaints</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {authorityDashboardStats.map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.statCard,
                  { backgroundColor: stat.background },
                  wide ? styles.statCardWide : styles.statCardMobile,
                ]}
              >
                <Ionicons name={stat.icon} size={20} color={stat.color} />
                <Text style={[styles.cardLabel, { color: stat.color }]}>{stat.label}</Text>
                <Text style={[styles.cardNumber, { color: stat.label === 'Total Issues' ? '#222222' : stat.color }]}>
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.urgencyCard}>
            <View style={styles.urgencyIcon}>
              <Ionicons name="flame-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.urgencyCopy}>
              <Text style={styles.urgencyLabel}>URGENCY PRIORITY</Text>
              <Text style={styles.urgencyTitle}>{urgentCount} complaints need urgent attention</Text>
              <Text style={styles.urgencyDescription}>The complaint list is ordered by residents’ urgency count.</Text>
            </View>
            <View style={styles.signalBox}>
              <Text style={styles.signalNumber}>{urgencySignals}</Text>
              <Text style={styles.signalLabel}>signals</Text>
            </View>
          </View>

          <View style={[styles.dashboardGrid, wide && styles.dashboardGridWide]}>
            <View style={[styles.complaintsSection, wide && styles.complaintsSectionWide]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Priority Complaints</Text>
                  <Text style={styles.sectionSubtitle}>Highest urgency appears first</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/authority/complaints' as never)}>
                  <Text style={styles.viewAll}>All Complaints</Text>
                </TouchableOpacity>
              </View>

              {priorityComplaints.slice(0, 4).map((complaint, index) => {
                const theme = statusTheme[complaint.status];
                return (
                  <Pressable
                    key={complaint.id}
                    onPress={() => openComplaint(complaint)}
                    style={({ pressed }) => [styles.complaintCard, pressed && styles.cardPressed]}
                  >
                    <View style={[styles.priorityRank, index < 3 && styles.priorityRankHigh]}>
                      <Text style={[styles.priorityRankText, index < 3 && styles.priorityRankTextHigh]}>{index + 1}</Text>
                    </View>
                    <View style={styles.complaintContent}>
                      <View style={styles.complaintTopRow}>
                        <Text style={styles.complaintTitle} numberOfLines={1}>{complaint.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: theme.background }]}> 
                          <Text style={[styles.statusText, { color: theme.color }]}>{complaint.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.complaintDescription} numberOfLines={1}>{complaint.description}</Text>
                      <View style={styles.complaintInfoRow}>
                        <View style={styles.infoItem}>
                          <Ionicons name="location-outline" size={12} color="#777777" />
                          <Text style={styles.infoText} numberOfLines={1}>{complaint.location}</Text>
                        </View>
                        <View style={styles.infoItem}>
                          <Ionicons name="calendar-outline" size={12} color="#777777" />
                          <Text style={styles.infoText}>{complaint.date}</Text>
                        </View>
                        <View style={styles.urgencyCount}>
                          <Ionicons name="arrow-up-circle" size={15} color="#C57C1B" />
                          <Text style={styles.urgencyCountText}>{complaint.urgency} urgent</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.mapSection, wide && styles.mapSectionWide]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Complaint Map</Text>
                  <Text style={styles.sectionSubtitle}>Locations of assigned complaints</Text>
                </View>
                <Ionicons name="map-outline" size={22} color="#23435D" />
              </View>
              <View style={styles.mapCard}>
                <AuthorityMap locations={authorityComplaints} />
              </View>
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Pending</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#C67B00' }]} /><Text style={styles.legendText}>In Progress</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} /><Text style={styles.legendText}>Resolved</Text></View>
              </View>
            </View>
          </View>

          <View style={styles.toolsSection}>
            <View style={styles.toolsHeading}>
              <Text style={styles.sectionTitle}>Authority Tools</Text>
              <Text style={styles.sectionSubtitle}>Open complete reports and review resident feedback</Text>
            </View>
            <View style={[styles.toolsGrid, wide && styles.toolsGridWide]}>
              <TouchableOpacity
                style={[styles.toolCard, styles.analyticsToolCard]}
                onPress={() => router.push('/authority/analytics' as never)}
              >
                <View style={[styles.toolIcon, styles.analyticsToolIcon]}>
                  <Ionicons name="bar-chart-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.toolCopy}>
                  <Text style={styles.toolTitle}>Analytics & Reports</Text>
                  <Text style={styles.toolDescription}>
                    Review authority performance and generate the complete complaint report.
                  </Text>
                  <View style={styles.toolLinkRow}>
                    <Text style={styles.analyticsToolLink}>Open reports</Text>
                    <Ionicons name="arrow-forward" size={15} color="#23435D" />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolCard, styles.feedbackToolCard]}
                onPress={() => router.push('/authority/feedback-center' as never)}
              >
                <View style={[styles.toolIcon, styles.feedbackToolIcon]}>
                  <Ionicons name="chatbox-ellipses-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.toolCopy}>
                  <Text style={styles.toolTitle}>Feedback Center</Text>
                  <Text style={styles.toolDescription}>
                    Read resident ratings and feedback for completed complaint work.
                  </Text>
                  <View style={styles.toolLinkRow}>
                    <Text style={styles.feedbackToolLink}>View feedback</Text>
                    <Ionicons name="arrow-forward" size={15} color="#B9854B" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#ECECEC', zIndex: 20 },
  logoSection: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 30, height: 30, borderRadius: 7 },
  logoText: { marginLeft: 9, fontSize: 18, fontWeight: '700', color: '#23435D' },
  logoSubtitle: { marginLeft: 9, marginTop: 1, fontSize: 9, fontWeight: '600', color: '#8A8A8A', letterSpacing: 0.3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
  headerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },
  notificationDot: { position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  profileTrigger: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5 },
  profileTriggerText: { color: '#23435D', fontSize: 12, fontWeight: '700' },
  profileMenu: { position: 'absolute', right: 0, top: 48, width: 240, padding: 14, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', boxShadow: '0 10px 28px rgba(35, 67, 93, 0.16)', zIndex: 30 },
  profileName: { color: '#1F2937', fontSize: 14, fontWeight: '700' },
  profileMeta: { color: '#7A7A7A', fontSize: 10, marginTop: 3 },
  menuDivider: { height: 1, backgroundColor: '#ECECEC', marginVertical: 10 },
  menuItem: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuItemText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  logoutText: { color: '#DC4B42' },
  scrollContent: { paddingBottom: 30 },
  contentContainer: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 18, gap: 18 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  smallTitle: { fontSize: 10, color: '#B9854B', fontWeight: '700', letterSpacing: 0.8 },
  bigTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 2 },
  welcomeText: { color: '#6B7280', fontSize: 12, marginTop: 5 },
  allComplaintsButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 16, borderRadius: 21, backgroundColor: '#23435D' },
  allComplaintsButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EEF0F3', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' },
  statCardWide: { flex: 1, minWidth: 180 },
  statCardMobile: { width: '48%' },
  cardLabel: { marginTop: 6, fontSize: 11 },
  cardNumber: { fontSize: 24, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  urgencyCard: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#FFF9F1', borderRadius: 14, borderWidth: 1, borderColor: '#F4DFC3', padding: 15 },
  urgencyIcon: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#C57C1B' },
  urgencyCopy: { flex: 1 },
  urgencyLabel: { color: '#B9854B', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  urgencyTitle: { color: '#4A341F', fontSize: 15, fontWeight: '700', marginTop: 3 },
  urgencyDescription: { color: '#80684F', fontSize: 11, marginTop: 4 },
  signalBox: { alignItems: 'flex-end', paddingLeft: 8 },
  signalNumber: { color: '#C57C1B', fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  signalLabel: { color: '#9A774F', fontSize: 9, fontWeight: '600' },
  dashboardGrid: { gap: 18 },
  dashboardGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  complaintsSection: { gap: 10 },
  complaintsSectionWide: { flex: 1.35 },
  mapSection: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingBottom: 12, borderWidth: 1, borderColor: '#ECEFF3', overflow: 'hidden' },
  mapSectionWide: { flex: 1, minWidth: 340 },
  sectionHeader: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  sectionSubtitle: { marginTop: 3, color: '#7B8491', fontSize: 10 },
  viewAll: { color: '#3B82F6', fontWeight: '600', fontSize: 13 },
  complaintCard: { minHeight: 91, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFF1F4', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
  cardPressed: { opacity: 0.78 },
  priorityRank: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF5FF' },
  priorityRankHigh: { backgroundColor: '#FFF1E5' },
  priorityRankText: { color: '#3B82F6', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  priorityRankTextHigh: { color: '#C57C1B' },
  complaintContent: { flex: 1, minWidth: 0 },
  complaintTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  complaintTitle: { flex: 1, color: '#222222', fontSize: 13, fontWeight: '700' },
  complaintDescription: { color: '#666666', fontSize: 11, marginTop: 4 },
  complaintInfoRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 7 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 3, maxWidth: 155 },
  infoText: { color: '#777777', fontSize: 9 },
  urgencyCount: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF7E8', borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
  urgencyCountText: { color: '#A7640C', fontSize: 9, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statusBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3 },
  statusText: { fontWeight: '700', fontSize: 8 },
  mapCard: { height: 330, marginHorizontal: 12, marginTop: 4, borderRadius: 14, backgroundColor: '#E8EDF4', overflow: 'hidden' },
  mapLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 13, paddingTop: 10, paddingHorizontal: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: '#6B7280', fontSize: 9 },
  toolsSection: { gap: 11, paddingTop: 2 },
  toolsHeading: { gap: 2 },
  toolsGrid: { gap: 12 },
  toolsGridWide: { flexDirection: 'row' },
  toolCard: { flex: 1, minHeight: 132, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, padding: 17, borderWidth: 1, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
  analyticsToolCard: { backgroundColor: '#F2F6F8', borderColor: '#DCE5EA' },
  feedbackToolCard: { backgroundColor: '#FFF9F1', borderColor: '#F0DFC8' },
  toolIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  analyticsToolIcon: { backgroundColor: '#23435D' },
  feedbackToolIcon: { backgroundColor: '#B9854B' },
  toolCopy: { flex: 1, minWidth: 0 },
  toolTitle: { color: '#1F2937', fontSize: 15, fontWeight: '700' },
  toolDescription: { color: '#6B7280', fontSize: 11, lineHeight: 17, marginTop: 5 },
  toolLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  analyticsToolLink: { color: '#23435D', fontSize: 11, fontWeight: '700' },
  feedbackToolLink: { color: '#B9854B', fontSize: 11, fontWeight: '700' },
});
