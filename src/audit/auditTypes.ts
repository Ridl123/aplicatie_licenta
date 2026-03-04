  export type AuditSeverity = "INFO" | "WARN" | "CRITICAL";
  export type AuditEntityType = "CALL" | "INTERVENTION" | "SYSTEM";

  export type AuditPayload = {
    severity: AuditSeverity;
    action: string;
    message: string;
    entityType: AuditEntityType;
    entityId?: string;
    actor: { id: string; name: string; role: string };
    meta?: Record<string, string | number | boolean | null>;
  };

  export type AuditEvent = {
    v: 1;
    seq: number;
    serverTime: string;      // în prod vine de la server
    prevHash: string | null; // null doar la genesis
    hash: string;            // SHA-256(payload+prevHash+seq+serverTime)
    alg: "ECDSA_P256_SHA256";
    keyId: string;
    signature: string;       // semnătură pe “signingString”
    payload: AuditPayload;
  };
