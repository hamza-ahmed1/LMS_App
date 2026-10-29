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
import NotificationsScreen from '@/screens/NotificationsScreen';
import NotificationDetailScreen from '@/screens/NotificationDetailScreen';
import { useNotificationsInbox } from '@/context/NotificationsContext';
import { colors } from '@/theme/theme';

export type MainTabParamList = {
  Home: undefined;
  Attendance: undefined;
  Marks: undefined;
  FeeChalan: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type NotificationsStackParamList = {
  NotificationsList: undefined;
  NotificationDetail: { id: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  ChangePassword: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const SettingsStackNav = createNativeStackNavigator<SettingsStackParamList>();
const NotificationsStackNav = createNativeStackNavigator<NotificationsStackParamList>();

function NotificationsStack() {
  return (
    <NotificationsStackNav.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <NotificationsStackNav.Screen name="NotificationsList" component={NotificationsScreen} options={{ headerShown: false }} />
      <NotificationsStackNav.Screen name="NotificationDetail" component={NotificationDetailScreen} options={{ title: 'Notification' }} />
    </NotificationsStackNav.Navigator>
  );
}

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
  Notifications: 'notifications',
  Settings: 'settings',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Home',
  Attendance: 'Attendance',
  Marks: 'Marks',
  FeeChalan: 'Fee Chalan',
  Notifications: 'Alerts',
  Settings: 'Settings',
};

export default function MainTabs() {
  const { unreadCount } = useNotificationsInbox();
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
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{ tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined }}
      />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
