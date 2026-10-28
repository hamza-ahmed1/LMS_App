import { apiClient } from '@/api/client';
import { AuthResponse } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // The header asks the backend to include the refresh token in the body,
  // since React Native can't rely on the httpOnly cookie browsers use.
  const { data } = await apiClient.post<AuthResponse>(
    '/api/auth/login',
    { Email: payload.email, Password: payload.password },
    { headers: { 'X-Client-Type': 'mobile' } }
  );
  return data;
}

/** Revokes this device's refresh token on the server. */
export async function logout(refreshToken: string | null): Promise<void> {
  await apiClient.post('/api/auth/logout', { refreshToken });
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  // NOTE: the backend's ChangePasswordDto field is spelled "NewPasword"
  // (missing an "s") — this is not a typo on our end, it must match
  // the DTO exactly or the API will silently ignore/reject the field.
  await apiClient.post('/api/auth/change-password', {
    CurrentPassword: payload.currentPassword,
    NewPasword: payload.newPassword,
  });
}

export async function sendResetCode(email: string): Promise<void> {
  await apiClient.post('/api/auth/send-reset-code', { Email: email });
}

export interface VerifyAndResetPayload {
  email: string;
  verificationCode: string;
  newPassword: string;
}

export async function verifyAndResetPassword(payload: VerifyAndResetPayload): Promise<void> {
  await apiClient.post('/api/auth/verify-and-reset', {
    Email: payload.email,
    VerificationCode: payload.verificationCode,
    NewPassword: payload.newPassword,
  });
}
