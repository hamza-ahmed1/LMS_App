import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { LoadingView } from '@/components/StateViews';
import ScreenContainer from '@/components/ScreenContainer';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { flushPendingNavigation, navigationRef } from './navigationRef';

export default function RootNavigator() {
  const { isBootstrapping, isAuthenticated } = useAuth();

  if (isBootstrapping) {
    return (
      <ScreenContainer>
        <LoadingView label="Getting things ready..." />
      </ScreenContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
