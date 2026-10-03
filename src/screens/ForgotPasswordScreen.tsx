import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { sendResetCode } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import TextField from '@/components/TextField';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing, typography } from '@/theme/theme';
import { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Please enter the email associated with your account.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendResetCode(email.trim());
      navigation.navigate('VerifyReset', { email: email.trim() });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send a reset code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your account email and we'll send you a 6-digit verification code.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Send Reset Code" onPress={handleSend} loading={loading} />

          <Text style={styles.back} onPress={() => navigation.goBack()}>
            Back to Log In
          </Text>
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
  back: {
    ...typography.bodyBold,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
