import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuditEvent, AuditPayload, AuditSeverity, AuditEntityType } from "./auditTypes";
import {
  loadOrCreateLocalKey,
  importPrivateKey,
  importPublicKey,
  sha256Base64,
  signBase64,
  stableStringify,
  verifyBase64,
} from "./crypto";

type AuditLogInput = {
  severity?: AuditSeverity;
  action: string;
  message: string;
  entityType: AuditEntityType;
  entityId?: string;
  meta?: Record<string, string | number | boolean | null>;
};

type IntegrityResult = { ok: boolean; reason?: string };

type AuditContextValue = {
  events: AuditEvent[];
  log: (e: AuditLogInput) => Promise<void>;
  clear: () => void;
  verifyAll: () => Promise<IntegrityResult>;
  exportJson: () => void;
  actor: { id: string; name: string; role: string };
};

const AuditContext = createContext<AuditContextValue | null>(null);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const actor = useMemo(() => ({ id: "op-1", name: "Operator", role: "OPERATOR" }), []);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [keysReady, setKeysReady] = useState(false);

  const keyMaterialRef = React.useRef<Awaited<ReturnType<typeof loadOrCreateLocalKey>> | null>(null);
  const privKeyRef = React.useRef<CryptoKey | null>(null);
  const pubKeyRef = React.useRef<CryptoKey | null>(null);

  // IMPORTANT: păstrăm o copie sincronă pentru a construi chain-ul corect (seq/prevHash)
  const eventsRef = React.useRef<AuditEvent[]>([]);
  // IMPORTANT: serializăm log-urile (dacă dai click rapid de 5 ori, seq rămâne corect)
  const logQueueRef = React.useRef<Promise<void>>(Promise.resolve());

  // ținem ref-ul sincron cu state-ul
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    (async () => {
      const mat = await loadOrCreateLocalKey();
      keyMaterialRef.current = mat;

      privKeyRef.current = await importPrivateKey(mat);
      pubKeyRef.current = await importPublicKey(mat);

      setKeysReady(true);

      // Genesis event (intră și el în chain)
      await log({
        action: "SYSTEM_BOOT",
        message: "UI pornit (mock).",
        entityType: "SYSTEM",
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clear() {
    setEvents([]);
    eventsRef.current = [];
  }

  async function computeHash(input: {
    v: 1;
    seq: number;
    serverTime: string;
    prevHash: string | null;
    payload: AuditPayload;
  }) {
    return sha256Base64(
      stableStringify({
        v: input.v,
        seq: input.seq,
        serverTime: input.serverTime,
        prevHash: input.prevHash,
        payload: input.payload,
      })
    );
  }

  async function log(input: AuditLogInput): Promise<void> {
    // serializăm ca să fie determinist (append-only)
    logQueueRef.current = logQueueRef.current.then(async () => {
      if (!keysReady || !keyMaterialRef.current || !privKeyRef.current) return;

      const prev = eventsRef.current; // newest-first
      const last = prev[0];
      const prevHash = last ? last.hash : null;
      const nextSeq = last ? last.seq + 1 : 1;

      const payload: AuditPayload = {
        severity: input.severity ?? "INFO",
        action: input.action,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
        actor,
        meta: input.meta,
      };

      // În prod: serverTime vine de la server
      const serverTime = new Date().toISOString();

      const base = {
        v: 1 as const,
        seq: nextSeq,
        serverTime,
        prevHash,
        alg: "ECDSA_P256_SHA256" as const,
        keyId: keyMaterialRef.current.keyId,
        payload,
      };

      const hash = await computeHash(base);

      const unsigned: Omit<AuditEvent, "signature"> = { ...base, hash };

      // semnăm un obiect determinist (stable stringify)
      const signingString = stableStringify(unsigned);
      const signature = await signBase64(privKeyRef.current, signingString);

      const evt: AuditEvent = { ...unsigned, signature };

      const next = [evt, ...prev];
      eventsRef.current = next;
      setEvents(next);
    });

    return logQueueRef.current;
  }

  async function verifyAll(): Promise<IntegrityResult> {
    if (!pubKeyRef.current) return { ok: false, reason: "Public key not ready" };

    // events sunt newest-first; verificăm în ordine crescătoare de seq
    const ordered = [...events].sort((a, b) => a.seq - b.seq);

    for (let i = 0; i < ordered.length; i++) {
      const ev = ordered[i];
      const expectedPrev = i === 0 ? null : ordered[i - 1].hash;

      // 1) chain prevHash
      if (ev.prevHash !== expectedPrev) {
        return { ok: false, reason: `Broken chain at seq=${ev.seq} (prevHash mismatch)` };
      }

      // 2) hash recompute
      const expectedHash = await sha256Base64(
        stableStringify({
          v: ev.v,
          seq: ev.seq,
          serverTime: ev.serverTime,
          prevHash: ev.prevHash,
          payload: ev.payload,
        })
      );

      if (ev.hash !== expectedHash) {
        return { ok: false, reason: `Hash mismatch at seq=${ev.seq}` };
      }

      // 3) signature verify pe același “unsigned” determinist
      const unsigned: Omit<AuditEvent, "signature"> = {
        v: ev.v,
        seq: ev.seq,
        serverTime: ev.serverTime,
        prevHash: ev.prevHash,
        hash: ev.hash,
        alg: ev.alg,
        keyId: ev.keyId,
        payload: ev.payload,
      };

      const signingString = stableStringify(unsigned);
      const sigOk = await verifyBase64(pubKeyRef.current, signingString, ev.signature);
      if (!sigOk) return { ok: false, reason: `Signature invalid at seq=${ev.seq}` };
    }

    return { ok: true };
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().replaceAll(":", "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const value: AuditContextValue = { events, log, clear, verifyAll, exportJson, actor };
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used inside AuditProvider");
  return ctx;
}
