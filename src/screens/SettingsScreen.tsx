import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '@/components/ScreenContainer';
import Card from '@/components/Card';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/theme/theme';
import { SettingsStackParamList } from '@/navigation/MainTabs';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { user, student, signOut } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(student?.fullName ?? user?.fullName ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{student?.fullName ?? user?.fullName}</Text>
            <Text style={styles.profileEmail}>{student?.email ?? user?.email}</Text>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem icon="person-outline" label="My Profile" onPress={() => navigation.navigate('Profile')} />
          <View style={styles.divider} />
          <MenuItem icon="lock-closed-outline" label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
        </Card>

        <Card style={styles.menuCard}>
          <MenuItem icon="log-out-outline" label="Log Out" onPress={confirmLogout} danger />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  profileName: { ...typography.bodyBold, color: colors.textPrimary, fontSize: 16 },
  profileEmail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  menuCard: { padding: 0, marginBottom: spacing.md, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapDanger: { backgroundColor: colors.danger + '15' },
  menuLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  menuLabelDanger: { color: colors.danger, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.md + 36 + spacing.md },
});
