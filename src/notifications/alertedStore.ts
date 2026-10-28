import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Ids of notifications the device has already shown as a system alert. Shared by the live
 * connection and the background task so a notification never pops up twice.
 */
const KEY = 'eduverse_alerted_notification_ids';
const MAX_IDS = 300;

async function read(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export const alertedStore = {
  async has(id: string): Promise<boolean> {
    return (await read()).includes(id);
  },

  /** Records ids and returns the ones that were not recorded before. */
  async addNew(ids: string[]): Promise<string[]> {
    const existing = await read();
    const fresh = ids.filter((id) => !existing.includes(id));
    if (fresh.length > 0) {
      await AsyncStorage.setItem(KEY, JSON.stringify([...fresh, ...existing].slice(0, MAX_IDS)));
    }
    return fresh;
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  },
};
