import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AuthorityPageHeaderProps = {
  title: string;
};

export default function AuthorityPageHeader({ title }: AuthorityPageHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image source={require('../../../assets/images/main_logo.png')} style={styles.logo} />
        <View>
          <Text style={styles.brandName}>Nogor Shomadhan</Text>
          <Text style={styles.brandRole}>Community Authority</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/authority/dashboard' as never)}>
        <Ionicons name="arrow-back" size={17} color="#23435D" />
        <Text style={styles.backText}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#ECECEC' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 30, height: 30, borderRadius: 7 },
  brandName: { marginLeft: 9, fontSize: 18, fontWeight: '700', color: '#23435D' },
  brandRole: { marginLeft: 9, marginTop: 1, fontSize: 9, fontWeight: '600', color: '#8A8A8A', letterSpacing: 0.3 },
  backButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 19, backgroundColor: '#F2F6F8' },
  backText: { color: '#23435D', fontSize: 11, fontWeight: '700' },
});
