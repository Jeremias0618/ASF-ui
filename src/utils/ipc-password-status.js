import * as http from '../plugins/http';
import * as storage from './storage';

export const IPC_PASSWORD_STATE = {
  /** Panel requires Authentication header (401 without it). */
  REQUIRED: 'REQUIRED',
  /** No IPCPassword for this client (200 without Authentication). */
  NOT_REQUIRED: 'NOT_REQUIRED',
  /** No IPCPassword but this IP is not allowed (403 permanent). */
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  UNKNOWN: 'UNKNOWN',
};

export function clearAuthenticationRequiredCache() {
  storage.remove('cache:authentication-required');
}

/**
 * Probe whether ASF currently requires IPCPassword, without trusting GET asf.IPCPassword
 * (ASF never serializes that field in API responses).
 */
export async function probeIpcPasswordState() {
  const previous = http.getAuthenticationHeader();
  clearAuthenticationRequiredCache();
  http.authenticate(null);

  try {
    await http.get('asf');
    return IPC_PASSWORD_STATE.NOT_REQUIRED;
  } catch (err) {
    if (err.message === 'HTTP Error 401') return IPC_PASSWORD_STATE.REQUIRED;

    if (err.message === 'HTTP Error 403') {
      const result = err.result && err.result.Result;
      if (result && result.Permanent) return IPC_PASSWORD_STATE.FORBIDDEN;
      return IPC_PASSWORD_STATE.RATE_LIMITED;
    }

    return IPC_PASSWORD_STATE.UNKNOWN;
  } finally {
    if (previous) http.authenticate(previous);
  }
}

export function isIpcPasswordRequired(state) {
  return state === IPC_PASSWORD_STATE.REQUIRED;
}
