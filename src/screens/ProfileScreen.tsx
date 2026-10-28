import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import Card from '@/components/Card';
import SectionTitle from '@/components/SectionTitle';
import InfoRow from '@/components/InfoRow';
import { useAuth } from '@/context/AuthContext';
import { spacing } from '@/theme/theme';

export default function ProfileScreen() {
  const { student, user } = useAuth();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionTitle title="Account" />
        <Card>
          <InfoRow label="Full Name" value={student?.fullName ?? user?.fullName} />
          <InfoRow label="Email" value={student?.email ?? user?.email} />
          <InfoRow label="Role" value={user?.roles?.join(', ')} />
        </Card>

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

        <SectionTitle title="Personal Info" />
        <Card>
          <InfoRow label="Gender" value={student?.gender} />
          <InfoRow label="CNIC" value={student?.cnic} />
          <InfoRow label="Phone" value={student?.phoneNumber} />
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
});
