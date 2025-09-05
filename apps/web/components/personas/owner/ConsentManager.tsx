"use client";

import React, { useEffect, useState } from 'react';

interface Consent {
  type: string;
  scope: string;
  validity: string;
  granted: boolean;
}

interface HistoryEntry {
  type: string;
  scope: string;
  action: "granted" | "revoked";
  date: string;
}

const STORAGE_KEY = "owner-consents";
const HISTORY_KEY = "owner-consent-history";

const defaultConsents: Consent[] = [
  { type: "email", scope: "marketing", validity: "", granted: false },
  { type: "profile", scope: "analytics", validity: "", granted: false },
];

export function ConsentManager() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setConsents(JSON.parse(raw) as Consent[]);
    } else {
      setConsents(defaultConsents);
    }
    const rawHistory = window.localStorage.getItem(HISTORY_KEY);
    if (rawHistory) setHistory(JSON.parse(rawHistory) as HistoryEntry[]);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consents));
  }, [consents]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const toggleConsent = (scope: string, type: string) => {
    const existing = consents.find((c) => c.scope === scope && c.type === type);
    const nextGranted = !existing?.granted;
    setConsents((prev) =>
      prev.map((c) =>
        c.scope === scope && c.type === type ? { ...c, granted: nextGranted } : c,
      ),
    );
    setHistory((prev) => [
      { scope, type, action: nextGranted ? "granted" : "revoked", date: new Date().toISOString() },
      ...prev,
    ]);
  };

  const setValidity = (scope: string, type: string, validity: string) => {
    setConsents((prev) =>
      prev.map((c) =>
        c.scope === scope && c.type === type ? { ...c, validity } : c,
      ),
    );
  };

  const scopes = Array.from(new Set(consents.map((c) => c.scope)));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Gerencie seus consentimentos conforme a LGPD. Você pode revogar a
        permissão a qualquer momento.
      </p>
      {scopes.map((scope) => (
        <fieldset key={scope} className="border p-2 rounded">
          <legend className="font-medium capitalize">{scope}</legend>
          <p className="text-xs text-gray-500 mb-2">
            Cada consentimento é aplicado somente a este escopo.
          </p>
          {consents
            .filter((c) => c.scope === scope)
            .map((c) => {
              const id = `${c.scope}-${c.type}`;
              return (
                <div key={id} className="flex items-center gap-2 mb-1">
                  <input
                    id={id}
                    type="checkbox"
                    checked={c.granted}
                    onChange={() => toggleConsent(c.scope, c.type)}
                  />
                  <label htmlFor={id} className="capitalize">
                    {c.type} ({c.scope})
                  </label>
                  <input
                    aria-label={`validity ${c.scope} ${c.type}`}
                    type="date"
                    className="border p-1 rounded text-xs"
                    value={c.validity}
                    onChange={(e) => setValidity(c.scope, c.type, e.target.value)}
                  />
                </div>
              );
            })}
        </fieldset>
      ))}
      <div>
        <h3 className="font-medium mb-1">Histórico</h3>
        <ul className="text-xs text-gray-600 flex flex-col gap-1">
          {history.map((h) => (
            <li key={h.date}>
              {new Date(h.date).toLocaleString()} - {h.scope}/{h.type} {h.action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export type { Consent, HistoryEntry };
