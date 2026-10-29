import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/api/client';
import TextField from '@/components/TextField';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, radius, shadow, spacing, typography } from '@/theme/theme';
import { APP_NAME } from '@/config';
import { AuthStackParamList } from '@/navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Entrance: header fades in, form card slides up; the leaf floats gently afterwards
  const intro = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        intro.setValue(1);
        return;
      }
      Animated.timing(intro, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [float, intro]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  const leafTranslate = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const leafRotate = float.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] });
  const cardTranslate = intro.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={styles.hero}>
          <View style={[styles.bubble, styles.bubbleOne]} />
          <View style={[styles.bubble, styles.bubbleTwo]} />
          <Animated.View style={{ opacity: intro, alignItems: 'center' }}>
            <Animated.Image
              source={require('../../assets/tcf-mark-white.png')}
              style={[styles.leaf, { transform: [{ translateY: leafTranslate }, { rotate: leafRotate }] }]}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>Student Portal</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.card, { opacity: intro, transform: [{ translateY: cardTranslate }] }]}>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in with your campus email to continue.</Text>

          <TextField
            label="Email"
            placeholder="you@student.tcf.org.pk"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            autoComplete="password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton title="Log In" onPress={handleLogin} loading={loading} style={styles.loginBtn} />

          <Text style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
            Forgot your password?
          </Text>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: intro }]}>
          <Image source={require('../../assets/tcf-logo.png')} style={styles.footerLogo} resizeMode="contain" accessibilityLabel="The Citizens Foundation" />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  bubble: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  bubbleOne: { width: 220, height: 220, top: -70, left: -60 },
  bubbleTwo: { width: 280, height: 280, bottom: -150, right: -90, backgroundColor: 'rgba(0,0,0,0.08)' },
  leaf: { width: 96, height: 75, marginBottom: spacing.md },
  appName: { ...typography.h1, color: colors.white, letterSpacing: 0.3 },
  tagline: { ...typography.body, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
    elevation: 4,
  },
  welcome: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  loginBtn: { marginTop: spacing.sm },
  forgot: { ...typography.bodyBold, color: colors.primary, textAlign: 'center', marginTop: spacing.lg },
  footer: { alignItems: 'center', paddingVertical: spacing.xl },
  footerLogo: { width: 180, height: 68, opacity: 0.9 },
});
