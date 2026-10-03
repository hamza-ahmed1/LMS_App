import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/screens/LoginScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import VerifyResetScreen from '@/screens/VerifyResetScreen';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  VerifyReset: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: 'Forgot Password' }}
      />
      <Stack.Screen
        name="VerifyReset"
        component={VerifyResetScreen}
        options={{ headerShown: true, title: 'Verify Code' }}
      />
    </Stack.Navigator>
  );
}
