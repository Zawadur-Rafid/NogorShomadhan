// src/services/settings.service.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

export type AppSettings = {
  id: number;
  ai_auto_categorize: boolean;
  duplicate_detection: boolean;
  duplicate_threshold_percent: number;
  duplicate_alerts: boolean;
  new_account_alerts: boolean;
  maintenance_mode: boolean;
  updated_by_acc_id: string | null;
  updated_at: string;
};

export type PersistenceMode = "remote" | "local";

export const DUPLICATE_THRESHOLD_OPTIONS = [
  { label: "High (85%)", percent: 85 },
  { label: "Medium (70%)", percent: 70 },
  { label: "Low (50%)", percent: 50 },
] as const;

export function thresholdPercentToLabel(percent: number): string {
  return (
    DUPLICATE_THRESHOLD_OPTIONS.find((option) => option.percent === percent)
      ?.label ?? "High (85%)"
  );
}

const SETTINGS_ID = 1;
const LOCAL_SETTINGS_KEY = "app_settings";

let persistenceMode: PersistenceMode = "remote";

export function getPersistenceMode(): PersistenceMode {
  return persistenceMode;
}

function defaultSettings(): Omit<AppSettings, "id"> {
  return {
    ai_auto_categorize: true,
    duplicate_detection: true,
    duplicate_threshold_percent: 85,
    duplicate_alerts: true,
    new_account_alerts: true,
    maintenance_mode: false,
    updated_by_acc_id: null,
    updated_at: new Date().toISOString(),
  };
}

function normalizeSettings(input: unknown): AppSettings {
  const base = { id: SETTINGS_ID, ...defaultSettings() } as AppSettings;
  if (input && typeof input === "object") {
    return { ...base, ...(input as Partial<AppSettings>) };
  }
  return base;
}

async function loadLocalSettings(): Promise<AppSettings> {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_SETTINGS_KEY);
    return stored ? normalizeSettings(JSON.parse(stored)) : normalizeSettings(null);
  } catch {
    return normalizeSettings(null);
  }
}

async function storeLocalSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Local storage unavailable; remote writes still cover most cases
  }
}

async function pushLocalSettings(settings: AppSettings): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .update({
      ai_auto_categorize: settings.ai_auto_categorize,
      duplicate_detection: settings.duplicate_detection,
      duplicate_threshold_percent: settings.duplicate_threshold_percent,
      duplicate_alerts: settings.duplicate_alerts,
      new_account_alerts: settings.new_account_alerts,
      maintenance_mode: settings.maintenance_mode,
      updated_by_acc_id: settings.updated_by_acc_id,
      updated_at: settings.updated_at,
    })
    .eq("id", SETTINGS_ID);

  if (!error) {
    persistenceMode = "remote";
  }
}

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .single();

  if (!error && data) {
    persistenceMode = "remote";
    const remote = normalizeSettings(data);

    const local = await loadLocalSettings();
    const hasPendingLocalChanges = local.updated_at !== remote.updated_at;
    if (hasPendingLocalChanges) {
      // Backend became available again: push any locally-saved overrides.
      void pushLocalSettings(local);
      return local;
    }

    return remote;
  }

  // Table missing (404) or backend unreachable: use local cache.
  persistenceMode = "local";
  return loadLocalSettings();
}

export async function updateAppSettings(
  patch: Partial<Omit<AppSettings, "id">>,
  updatedByAccId?: string | null,
): Promise<AppSettings> {
  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("app_settings")
    .update({
      ...patch,
      ...(updatedByAccId ? { updated_by_acc_id: updatedByAccId } : {}),
      updated_at: updatedAt,
    })
    .eq("id", SETTINGS_ID)
    .select("*")
    .single();

  if (!error && data) {
    persistenceMode = "remote";
    const merged = normalizeSettings(data);
    await storeLocalSettings(merged);
    return merged;
  }

  // Fall back to local persistence so the UI never blocks on a missing backend.
  // Values are pushed to Supabase automatically once the table/migration exists.
  persistenceMode = "local";
  const current = await loadLocalSettings();
  const merged = normalizeSettings({
    ...current,
    ...patch,
    updated_by_acc_id: updatedByAccId ?? current.updated_by_acc_id,
    updated_at: updatedAt,
  });
  await storeLocalSettings(merged);
  return merged;
}