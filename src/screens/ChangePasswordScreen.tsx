import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenContainer from '@/components/ScreenContainer';
import TextField from '@/components/TextField';
import PrimaryButton from '@/components/PrimaryButton';
import { changePassword } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { colors, spacing, typography } from '@/theme/theme';
import { SettingsStackParamList } from '@/navigation/MainTabs';

type Props = NativeStackScreenProps<SettingsStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      Alert.alert('Success', 'Your password has been changed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change your password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TextField label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} isPassword />
          <TextField label="New Password" value={newPassword} onChangeText={setNewPassword} isPassword />
          <TextField label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Update Password" onPress={handleSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
});
