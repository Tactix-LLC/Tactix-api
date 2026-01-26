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

const DEBUG_LOG = true; // set false to reduce logs; helps debug "String is not a subtype of num"

function forceNum(val: unknown): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function logStringAsNum(context: string, field: string, value: unknown): void {
  if (typeof value === "string") {
    console.log(`[normalize_player] ${context} FIELD "${field}" was STRING (expected num), converted: ${JSON.stringify(value)}`);
  }
}

export function normalizePlayerForResponse(player: any, playerIndex?: number): any {
  if (!player || typeof player !== "object") {
    if (DEBUG_LOG) {
      console.log(`[normalize_player] WARNING: player at index ${playerIndex ?? "?"} is null/undefined/non-object, skipping`);
    }
    return player;
  }

  // Mongoose subdocs (e.g. from refresh flow) store schema keys on prototype – spread misses them.
  // Convert to plain object first so pid, full_name, position, club, etc. are preserved.
  let plain: Record<string, any>;
  if (typeof (player as any).toObject === "function") {
    plain = (player as any).toObject();
  } else {
    plain = { ...player };
  }
  const normalized: Record<string, any> = { ...plain };

  // Ensure required String fields are always strings (never null) - Flutter ClientPlayer requires String, not String?
  const requiredStringFields = ["pid", "_id", "position", "club", "full_name", "club_logo"] as const;
  for (const field of requiredStringFields) {
    if (normalized[field] === undefined || normalized[field] === null) {
      normalized[field] = "";
    } else {
      // Convert to string if not already
      if (field === "_id" && typeof normalized[field] === "object") {
        try {
          normalized[field] = normalized[field]?.toString ? normalized[field].toString() : String(normalized[field]);
        } catch {
          normalized[field] = String(normalized[field]);
        }
      } else {
        normalized[field] = String(normalized[field]);
      }
    }
  }

  // Ensure required bool fields are always boolean (never null) - Flutter ClientPlayer requires bool, not bool?
  const requiredBoolFields = ["is_bench", "is_captain", "is_vice_captain", "is_switched"] as const;
  for (const field of requiredBoolFields) {
    if (normalized[field] === undefined || normalized[field] === null) {
      normalized[field] = false;
    } else {
      normalized[field] = Boolean(normalized[field]);
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
    for (const k of Object.keys(st)) {
      if (k.startsWith("$") || k.startsWith("__")) delete st[k];
    }
    normalized.stat = st;
  }

  // Strip Mongoose internals (__parentArray, __index, $isNew, etc.) – don't send to client
  for (const key of Object.keys(normalized)) {
    if (key.startsWith("$") || key.startsWith("__")) delete normalized[key];
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
