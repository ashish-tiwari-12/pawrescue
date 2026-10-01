export interface SecurityEvent {
  eventType:
    | "AUTH_FAILED"
    | "AUTH_SUCCESS"
    | "UNAUTHORIZED_ACCESS"
    | "FORBIDDEN_RESOURCE"
    | "RATE_LIMIT_EXCEEDED"
    | "NOSQL_INJECTION_ATTEMPT"
    | "XSS_DETECTED"
    | "INVALID_FILE_UPLOAD"
    | "PASSWORD_RESET_REQUEST"
    | "PASSWORD_RESET_SUCCESS"
    | "PRIVILEGE_ESCALATION_BLOCKED";
  ip?: string;
  userId?: string;
  email?: string;
  resource?: string;
  details?: string;
  userAgent?: string;
}

// Helper to mask sensitive strings (e.g. emails, passwords, tokens)
export const maskSensitive = (str?: string): string => {
  if (!str) return "N/A";
  if (str.includes("@")) {
    const [local, domain] = str.split("@");
    const maskedLocal = local.length > 2 ? `${local[0]}***${local.slice(-1)}` : `${local[0]}***`;
    return `${maskedLocal}@${domain}`;
  }
  if (str.length > 8) {
    return `${str.slice(0, 3)}***${str.slice(-3)}`;
  }
  return "***";
};

export const logSecurityEvent = (event: SecurityEvent) => {
  const timestamp = new Date().toISOString();
  const safeEmail = event.email ? maskSensitive(event.email) : undefined;
  
  const logEntry = {
    timestamp,
    level: ["NOSQL_INJECTION_ATTEMPT", "XSS_DETECTED", "PRIVILEGE_ESCALATION_BLOCKED", "RATE_LIMIT_EXCEEDED"].includes(event.eventType)
      ? "WARN"
      : "INFO",
    ...event,
    email: safeEmail
  };

  const symbol = logEntry.level === "WARN" ? "🚨 [SECURITY ALERT]" : "🛡️ [SECURITY AUDIT]";
  console.log(`${symbol} ${event.eventType} - IP: ${event.ip || "unknown"} - ${event.details || ""}`);
};
