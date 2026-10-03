import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '@/screens/HomeScreen';
import AttendanceScreen from '@/screens/AttendanceScreen';
import MarksScreen from '@/screens/MarksScreen';
import FeeChalanScreen from '@/screens/FeeChalanScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import ChangePasswordScreen from '@/screens/ChangePasswordScreen';
import { colors } from '@/theme/theme';

export type MainTabParamList = {
  Home: undefined;
  Attendance: undefined;
  Marks: undefined;
  FeeChalan: undefined;
  Settings: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  ChangePassword: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const SettingsStackNav = createNativeStackNavigator<SettingsStackParamList>();

function SettingsStack() {
  return (
    <SettingsStackNav.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <SettingsStackNav.Screen name="SettingsHome" component={SettingsScreen} options={{ headerShown: false }} />
      <SettingsStackNav.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <SettingsStackNav.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
    </SettingsStackNav.Navigator>
  );
}

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Attendance: 'checkmark-done-circle',
  Marks: 'school',
  FeeChalan: 'receipt',
  Settings: 'settings',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Home',
  Attendance: 'Attendance',
  Marks: 'Marks',
  FeeChalan: 'Fee Chalan',
  Settings: 'Settings',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabel: LABELS[route.name as keyof MainTabParamList],
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={
              (focused
                ? ICONS[route.name as keyof MainTabParamList]
                : (`${ICONS[route.name as keyof MainTabParamList]}-outline` as keyof typeof Ionicons.glyphMap)) as any
            }
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Marks" component={MarksScreen} />
      <Tab.Screen name="FeeChalan" component={FeeChalanScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
