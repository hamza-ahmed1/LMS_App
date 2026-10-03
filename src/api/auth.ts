import { apiClient } from '@/api/client';
import { AuthResponse } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', {
    Email: payload.email,
    Password: payload.password,
  });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout');
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
