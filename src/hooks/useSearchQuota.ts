import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'worship_ai_search_quota';
const DAILY_LIMIT = 20;
/** Minimum seconds between searches to respect the 10 RPM limit. */
const COOLDOWN_SECONDS = 7;

interface QuotaRecord {
  date: string;       // ISO date string: YYYY-MM-DD
  used: number;
  lastUsedAt?: number; // unix ms timestamp of last search
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function readRecord(): QuotaRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayDateString(), used: 0 };
    const record = JSON.parse(raw) as QuotaRecord;
    // Reset if it's a new day
    if (record.date !== todayDateString()) {
      return { date: todayDateString(), used: 0 };
    }
    return record;
  } catch {
    return { date: todayDateString(), used: 0 };
  }
}

function writeRecord(record: QuotaRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage unavailable (e.g. private mode) — silently ignore
  }
}

export function useSearchQuota() {
  const [record, setRecord] = useState<QuotaRecord>({ date: todayDateString(), used: 0 });
  const [cooldownSecsLeft, setCooldownSecsLeft] = useState(0);

  // Read from localStorage on mount (client only)
  useEffect(() => {
    const stored = readRecord();
    setRecord(stored);
    // Restore any in-progress cooldown from last search
    if (stored.lastUsedAt) {
      const elapsed = Math.floor((Date.now() - stored.lastUsedAt) / 1000);
      const remaining = COOLDOWN_SECONDS - elapsed;
      if (remaining > 0) setCooldownSecsLeft(remaining);
    }
  }, []);

  // Tick cooldown countdown every second
  useEffect(() => {
    if (cooldownSecsLeft <= 0) return;
    const t = setTimeout(() => setCooldownSecsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldownSecsLeft]);

  const used = record.used;
  const remaining = Math.max(0, DAILY_LIMIT - used);
  const isExhausted = remaining === 0;
  const isCoolingDown = cooldownSecsLeft > 0;

  const consume = useCallback(() => {
    const now = Date.now();
    setRecord((prev) => {
      const next: QuotaRecord = {
        date: todayDateString(),
        used: prev.date === todayDateString() ? prev.used + 1 : 1,
        lastUsedAt: now,
      };
      writeRecord(next);
      return next;
    });
    setCooldownSecsLeft(COOLDOWN_SECONDS);
  }, []);

  return {
    used,
    remaining,
    limit: DAILY_LIMIT,
    isExhausted,
    isCoolingDown,
    cooldownSecsLeft,
    consume,
  };
}
