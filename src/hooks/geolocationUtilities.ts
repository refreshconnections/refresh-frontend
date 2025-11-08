// src/utils/geolocation.ts
import { Geolocation, PermissionStatus, Position, PositionOptions } from '@capacitor/geolocation';

export type GetPositionOpts = {
  fastTimeoutMs?: number;     // first, coarse/fast attempt
  preciseTimeoutMs?: number;  // second, high-accuracy attempt
  maximumAgeMs?: number;      // accept a cached fix up to this age
};

/**
 * Android-friendly geolocation:
 * 1) Ensures permission
 * 2) Tries quick coarse fix (cell/Wi-Fi)
 * 3) Tries high-accuracy GPS with longer timeout
 * 4) Falls back to watchPosition (resolve on first fix)
 */
export async function getCurrentPositionSmart(opts: GetPositionOpts = {}): Promise<Position> {
  const {
    fastTimeoutMs = 8000,
    preciseTimeoutMs = 25000,
    maximumAgeMs = 60000,
  } = opts;

  // --- 1) Permissions
  let perm: PermissionStatus = await Geolocation.checkPermissions();
  if (perm.location === 'denied' || perm.location === 'prompt') {
    perm = await Geolocation.requestPermissions();
    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
      throw new Error('Location permission not granted');
    }
  }

  // --- 2) Fast coarse attempt
  try {
    return await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: fastTimeoutMs,
      maximumAge: maximumAgeMs,
    } as PositionOptions);
  } catch {
    // continue to precise
  }

  // --- 3) Precise attempt (GPS)
  try {
    return await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: preciseTimeoutMs,
      maximumAge: maximumAgeMs,
    } as PositionOptions);
  } catch {
    // continue to watch fallback
  }

  // --- 4) Watch fallback: resolve on first fix, with safety timeout
  return await new Promise<Position>(async (resolve, reject) => {
    let done = false;

    // Capacitor v7+: watchPosition returns Promise<string> (CallbackID) → await it
    const id = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (pos, err) => {
        if (done) return;

        if (pos) {
          done = true;
          clearTimeout(timer);
          Geolocation.clearWatch({ id });
          resolve(pos);
          return;
        }

        if (err) {
          done = true;
          clearTimeout(timer);
          Geolocation.clearWatch({ id });
          reject(err);
        }
      }
    );

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      Geolocation.clearWatch({ id });
      reject(new Error('Location watch timed out'));
    }, preciseTimeoutMs);
  });
}
