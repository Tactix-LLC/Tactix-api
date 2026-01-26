/**
 * Normalizes player objects for API responses so Flutter ClientPlayer/Stat
 * always receive correct types (num as number, id/pid as string).
 * Logs any fields that are string when num is expected (for debugging).
 */

const NUMERIC_FIELDS = [
  "price",
  "fantasy_point",
  "final_fantasy_point",
  "minutesplayed",
  "goalscored",
  "assist",
  "passes",
  "shotsontarget",
  "cleansheet",
  "shotssaved",
  "penaltysaved",
  "tacklesuccessful",
  "yellowcard",
  "redcard",
  "owngoal",
  "goalsconceded",
  "penaltymissed",
  "chancecreated",
  "starting",
  "substitute",
  "blockedshot",
  "interceptionwon",
  "clearance",
] as const;

const STAT_NUMERIC_FIELDS = [
  ...NUMERIC_FIELDS.filter((f) => f !== "starting"),
  "starting11",
] as const;

const DEBUG_LOG = false; // set true to debug "String is not a subtype of num" (logs field types)

function forceNum(val: unknown): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function logStringAsNum(context: string, field: string, value: unknown): void {
  if (!DEBUG_LOG) return;
  if (typeof value === "string") {
    console.log(`[normalize_player] ${context} FIELD "${field}" is STRING (expected num): ${JSON.stringify(value)}`);
  }
}

export function normalizePlayerForResponse(player: any): any {
  if (!player || typeof player !== "object") return player;

  const normalized: Record<string, any> = { ...player };

  // Ensure pid and _id are strings (Flutter ClientPlayer expects String)
  if (normalized.pid !== undefined && normalized.pid !== null) {
    normalized.pid = String(normalized.pid);
  }
  if (normalized._id !== undefined && normalized._id !== null) {
    try {
      normalized._id = typeof normalized._id === "object" && normalized._id?.toString
        ? normalized._id.toString()
        : String(normalized._id);
    } catch {
      normalized._id = String(normalized._id);
    }
  }

  for (const field of NUMERIC_FIELDS) {
    const v = normalized[field];
    logStringAsNum("player", field, v);
    normalized[field] = forceNum(v);
  }

  if (normalized.stat && typeof normalized.stat === "object") {
    const st: Record<string, any> = { ...normalized.stat };
    for (const field of STAT_NUMERIC_FIELDS) {
      const v = st[field];
      logStringAsNum("stat", field, v);
      st[field] = forceNum(v);
    }
    normalized.stat = st;
  }

  return normalized;
}

export function normalizeGameWeekTeamForResponse(doc: any): any {
  if (!doc) return doc;

  const raw = doc.toObject ? doc.toObject() : { ...doc };

  if (Array.isArray(raw.players)) {
    raw.players = raw.players.map((p: any, idx: number) => {
      if (DEBUG_LOG && idx === 0) {
        console.log("[normalize_player] FIRST PLAYER (before):", JSON.stringify({
          pid: [typeof (p as any).pid, (p as any).pid],
          fantasy_point: [typeof (p as any).fantasy_point, (p as any).fantasy_point],
          stat: (p as any).stat ? { starting11: [typeof (p as any).stat?.starting11, (p as any).stat?.starting11] } : null,
        }));
      }
      return normalizePlayerForResponse(p);
    });
    if (DEBUG_LOG && raw.players[0]) {
      console.log("[normalize_player] FIRST PLAYER (after):", JSON.stringify({
        pid: [typeof raw.players[0].pid, raw.players[0].pid],
        fantasy_point: [typeof raw.players[0].fantasy_point, raw.players[0].fantasy_point],
        stat: raw.players[0].stat ? { starting11: [typeof raw.players[0].stat?.starting11, raw.players[0].stat?.starting11] } : null,
      }));
    }
  }

  if (raw.total_fantasy_point !== undefined && raw.total_fantasy_point !== null) {
    raw.total_fantasy_point = forceNum(raw.total_fantasy_point);
  }

  return raw;
}

export function normalizeTeamForResponse(doc: any): any {
  if (!doc) return doc;

  const raw = doc.toObject ? doc.toObject() : { ...doc };

  if (Array.isArray(raw.players)) {
    raw.players = raw.players.map((p: any) => normalizePlayerForResponse(p));
  }

  if (raw.total_fantasy_point !== undefined && raw.total_fantasy_point !== null) {
    raw.total_fantasy_point = forceNum(raw.total_fantasy_point);
  }
  if (raw.budget !== undefined && raw.budget !== null) {
    raw.budget = forceNum(raw.budget);
  }

  return raw;
}
