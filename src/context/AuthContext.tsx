import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginApi, logout as logoutApi } from '@/api/auth';
import { getStudentProfile } from '@/api/student';
import { setUnauthorizedHandler } from '@/api/client';
import { tokenStorage } from '@/utils/tokenStorage';
import { StudentProfile, UserDto } from '@/types';

interface AuthContextValue {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  user: UserDto | null;
  student: StudentProfile | null;
  studentLoading: boolean;
  studentError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshStudentProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [user, setUser] = useState<UserDto | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  const loadStudentProfile = useCallback(async (userId: string) => {
    setStudentLoading(true);
    setStudentError(null);
    try {
      const profile = await getStudentProfile(userId);
      setStudent(profile);
    } catch (err) {
      setStudentError('Could not load your profile. Pull to refresh to try again.');
    } finally {
      setStudentLoading(false);
    }
  }, []);

  // Try to restore a previous session on app launch.
  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([
        tokenStorage.getAccessToken(),
        tokenStorage.getUser<UserDto>(),
      ]);
      if (token && storedUser) {
        setUser(storedUser);
        await loadStudentProfile(storedUser.id);
      }
      setIsBootstrapping(false);
    })();
  }, [loadStudentProfile]);

  const signOut = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout — clear local state regardless.
    }
    await tokenStorage.clearAll();
    setUser(null);
    setStudent(null);
    setStudentError(null);
  }, []);

  // If any API call gets a 401, force a clean sign-out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStudent(null);
    });
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await loginApi({ email, password });
      await tokenStorage.setAccessToken(res.accessToken);
      await tokenStorage.setUser(res.user);
      setUser(res.user);
      await loadStudentProfile(res.user.id);
    },
    [loadStudentProfile]
  );

  const refreshStudentProfile = useCallback(async () => {
    if (user) await loadStudentProfile(user.id);
  }, [user, loadStudentProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      isAuthenticated: !!user,
      user,
      student,
      studentLoading,
      studentError,
      signIn,
      signOut,
      refreshStudentProfile,
    }),
    [isBootstrapping, user, student, studentLoading, studentError, signIn, signOut, refreshStudentProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
