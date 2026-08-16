"use client";

import { useEffect } from "react";
import { writeStoredValue } from "@/lib/use-stored-value";

export const PREFS_STORAGE_KEY = "qt-notification-prefs";
const STORAGE_KEY = PREFS_STORAGE_KEY;
const FIRED_KEY   = "qt-notification-fired";

export type NotifPrefs = {
  dailyEnabled:  boolean;
  dailyTime:     string; // "HH:MM"
  weeklyEnabled: boolean;
  weeklyDay:     number; // 0=Sun … 6=Sat
  weeklyTime:    string; // "HH:MM"
};

export const DEFAULT_PREFS: NotifPrefs = {
  dailyEnabled:  false,
  dailyTime:     "08:30",
  weeklyEnabled: false,
  weeklyDay:     0,
  weeklyTime:    "19:00",
};

export function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

export function savePrefs(prefs: NotifPrefs) {
  // Shared writer so useStoredValue readers (settings UI) re-render.
  writeStoredValue(STORAGE_KEY, JSON.stringify(prefs));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function thisWeekKey() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day;
  const sun = new Date(d.setDate(diff));
  return `week-${sun.toISOString().slice(0, 10)}`;
}

function shouldFire(timeStr: string): boolean {
  const [hh, mm] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  return now >= target;
}

function getFiredKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function markFired(key: string) {
  const set = getFiredKeys();
  set.add(key);
  // Keep only last 30 entries to avoid unbounded growth
  const arr = Array.from(set).slice(-30);
  localStorage.setItem(FIRED_KEY, JSON.stringify(arr));
}

function fireNotification(title: string, body: string, url?: string) {
  if (Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/qtlogo.png",
    badge: "/qtlogo.png",
  });
  if (url) n.onclick = () => { window.focus(); window.location.href = url; };
}

function checkAndFire() {
  const prefs = loadPrefs();
  const fired  = getFiredKeys();

  if (prefs.dailyEnabled) {
    const key = `daily-${todayKey()}`;
    if (!fired.has(key) && shouldFire(prefs.dailyTime)) {
      fireNotification(
        "QT — Günlük Hazırlık",
        "Bugünkü piyasaya hazır mısın? Daily Prep'i tamamla.",
        "/daily-prep"
      );
      markFired(key);
    }
  }

  if (prefs.weeklyEnabled) {
    const today = new Date().getDay();
    const key   = `weekly-${thisWeekKey()}`;
    if (today === prefs.weeklyDay && !fired.has(key) && shouldFire(prefs.weeklyTime)) {
      fireNotification(
        "QT — Haftalık Review",
        "Bu haftanın review'ını yapmayı unutma.",
        "/weekly-review"
      );
      markFired(key);
    }
  }
}

export function NotificationScheduler() {
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    checkAndFire();
    const id = setInterval(checkAndFire, 60_000); // check every minute
    return () => clearInterval(id);
  }, []);

  return null;
}
