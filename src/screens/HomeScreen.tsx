import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import Card from '@/components/Card';
import SectionTitle from '@/components/SectionTitle';
import InfoRow from '@/components/InfoRow';
import { LoadingView, ErrorView } from '@/components/StateViews';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme/theme';

function formatDate(value?: string | null): string {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function HomeScreen() {
  const { student, studentLoading, studentError, refreshStudentProfile, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshStudentProfile();
    setRefreshing(false);
  }, [refreshStudentProfile]);

  if (studentLoading && !student) {
    return (
      <ScreenContainer>
        <LoadingView label="Loading your profile..." />
      </ScreenContainer>
    );
  }

  if (studentError && !student) {
    return (
      <ScreenContainer>
        <ErrorView message={studentError} onRetry={refreshStudentProfile} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{student?.fullName ?? user?.fullName ?? 'Student'}</Text>
        </View>

        <SectionTitle title="Institute Info" />
        <Card>
          <InfoRow label="Student ID" value={student?.studentId} />
          <InfoRow label="Section" value={student?.section} />
          <InfoRow label="Department" value={student?.department} />
          <InfoRow label="Batch" value={student?.batch} />
          <InfoRow label="Major Subject" value={student?.majorSubject} />
          <InfoRow label="Campus" value={student?.campus} />
          <InfoRow label="Status" value={student?.status} />
        </Card>

        <SectionTitle title="Personal Information" />
        <Card>
          <InfoRow label="Name" value={student?.fullName} />
          <InfoRow label="Date of Birth" value={formatDate(student?.dateOfBirth)} />
          <InfoRow label="Gender" value={student?.gender} />
          <InfoRow label="CNIC" value={student?.cnic} />
          <InfoRow label="Email" value={student?.email} />
          <InfoRow label="Phone" value={student?.phoneNumber} />
        </Card>

        <SectionTitle title="Family Info" />
        <Card>
          <InfoRow label="Father's Name" value={student?.fatherName} />
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  header: { marginBottom: spacing.sm },
  greeting: { ...typography.body, color: colors.textSecondary },
  name: { ...typography.h1, color: colors.textPrimary },
});
