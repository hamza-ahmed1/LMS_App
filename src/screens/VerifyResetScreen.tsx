import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { verifyAndResetPassword, sendResetCode } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import TextField from '@/components/TextField';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing, typography } from '@/theme/theme';
import { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyReset'>;

export default function VerifyResetScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!code.trim() || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyAndResetPassword({ email, verificationCode: code.trim(), newPassword });
      Alert.alert('Success', 'Your password has been reset. Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'The code is incorrect or has expired.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await sendResetCode(email);
      Alert.alert('Code sent', `A new verification code was sent to ${email}.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not resend the code.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Enter Reset Code</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {email}. It expires in 15 minutes.</Text>

        <View style={styles.form}>
          <TextField
            label="Verification Code"
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TextField label="New Password" placeholder="••••••••" value={newPassword} onChangeText={setNewPassword} isPassword />
          <TextField
            label="Confirm New Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Reset Password" onPress={handleReset} loading={loading} />
          <PrimaryButton
            title="Resend Code"
            onPress={handleResend}
            loading={resending}
            variant="outline"
            style={styles.resendBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  form: { width: '100%' },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  resendBtn: { marginTop: spacing.md },
});
