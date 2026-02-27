import { RequestHandler } from "express";
import axios from "axios";
import configs from "../../configs";
import AppError from "../../utils/app_error";
import GameWeek from "../game_week/dal";

/**
 * GET /api/v1/fixture/matches?game_week=26
 * Returns matches for the given game week (or the active one if no param).
 *
 * - If the game week exists in our DB: use its stored match_ids (so DGW matches
 *   with a different Entity Sport round are included).
 * - If the game week is not in our DB (e.g. a future GW the user browses to):
 *   fall back to fetching from Entity Sport by round number.
 */
export const getActiveFixtures: RequestHandler = async (req, res, next) => {
  try {
    const requestedGW = req.query.game_week
      ? String(req.query.game_week)
      : null;

    // Resolve the game week document
    let gameWeek = requestedGW
      ? await GameWeek.getGameWeek(requestedGW)
      : await GameWeek.getLiveGameWeek();

    // If no DB record exists for the requested GW, fall back to Entity Sport
    // round-based pagination (allows browsing future / uncreated GWs).
    // We scan a wider range so rescheduled matches (which Entity Sport may
    // re-label as a later round) are still found and shown in place of the
    // cancelled original entry.
    if (!gameWeek && requestedGW) {
      const roundNum = parseInt(requestedGW) || 1;
      const startPage = Math.max(1, roundNum - 1);
      const endPage = roundNum + 3;

      // Use the active GW cid, or fall back to the hardcoded Premier League cid
      const activeGW = await GameWeek.getLiveGameWeek();
      const cid = activeGW?.cid ?? "1600";

      // Collect all matches from the scanned pages
      const allItems: any[] = [];
      for (let page = startPage; page <= endPage; page++) {
        let resp: any;
        try {
          resp = await axios.get(
            `${configs.entity_sport.url}/competition/${cid}/matches?token=${configs.entity_sport.token}&paged=${page}`
          );
        } catch (e: any) {
          if (e?.response?.status === 404) break;
          throw e;
        }
        if (resp.data.status !== "ok") break;
        const pageItems: any[] = resp.data.response?.items ?? [];
        if (pageItems.length === 0) break;
        allItems.push(...pageItems);
      }

      // Group by matchup (home tid vs away tid) to detect rescheduled fixtures
      const matchupMap = new Map<string, any[]>();
      for (const m of allItems) {
        const key = `${m.teams?.home?.tid}_vs_${m.teams?.away?.tid}`;
        if (!matchupMap.has(key)) matchupMap.set(key, []);
        matchupMap.get(key)!.push(m);
      }

      const isCancelled = (m: any) =>
        (m.status_str ?? "").toLowerCase().includes("cancel");

      const items: any[] = [];
      for (const group of matchupMap.values()) {
        // Only process matchups that have at least one entry for the target round
        const hasTargetRound = group.some(
          (m) => String(m.round) === String(roundNum)
        );
        if (!hasTargetRound) continue;

        const cancelled = group.filter(isCancelled);
        const nonCancelled = group.filter((m) => !isCancelled(m));

        if (cancelled.length > 0 && nonCancelled.length > 0) {
          // Rescheduled fixture: show only the non-cancelled version
          // (may have a different round number assigned by Entity Sport)
          items.push(...nonCancelled);
        } else if (cancelled.length > 0) {
          // No rescheduled version yet; show the cancelled entry for this round
          const forRound = cancelled.filter(
            (m) => String(m.round) === String(roundNum)
          );
          items.push(forRound[0] ?? cancelled[0]);
        } else {
          // Normal (no cancellations): only include entries for the target round
          items.push(
            ...group.filter((m) => String(m.round) === String(roundNum))
          );
        }
      }

      return res.status(200).json({
        status: "ok",
        game_week: requestedGW,
        response: { items },
      });
    }

    if (!gameWeek) {
      return res.status(200).json({ status: "ok", response: { items: [] } });
    }

    const matchIdSet = new Set<string>((gameWeek.match_ids ?? []).map(String));

    if (matchIdSet.size === 0) {
      return res.status(200).json({
        status: "ok",
        game_week: gameWeek.game_week,
        response: { items: [] },
      });
    }

    const roundNum = parseInt(gameWeek.game_week) || 1;
    const startPage = Math.max(1, roundNum - 1);
    const endPage = roundNum + 6;

    const items: any[] = [];

    for (let page = startPage; page <= endPage; page++) {
      let resp: any;
      try {
        resp = await axios.get(
          `${configs.entity_sport.url}/competition/${gameWeek.cid}/matches?token=${configs.entity_sport.token}&paged=${page}`
        );
      } catch (e: any) {
        if (e?.response?.status === 404) break;
        throw e;
      }

      if (resp.data.status !== "ok") break;

      const pageItems: any[] = resp.data.response?.items ?? [];
      if (pageItems.length === 0) break;

      for (const m of pageItems) {
        if (matchIdSet.has(String(m.mid))) {
          items.push(m);
        }
      }

      if (items.length >= matchIdSet.size) break;
    }

    res.status(200).json({
      status: "ok",
      game_week: gameWeek.game_week,
      response: { items },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/fixture/matches/:matchId/info
 * Proxies Entity Sport match info endpoint.
 */
export const proxyMatchInfo: RequestHandler = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const resp = await axios.get(
      `${configs.entity_sport.url}/matches/${matchId}/info?token=${configs.entity_sport.token}`
    );
    res.status(200).json(resp.data);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return next(new AppError("Match not found", 404));
    }
    next(error);
  }
};

/**
 * GET /api/v1/fixture/matches/:matchId/stats
 * Proxies Entity Sport match stats endpoint.
 */
export const proxyMatchStats: RequestHandler = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const resp = await axios.get(
      `${configs.entity_sport.url}/matches/${matchId}/statsv2?token=${configs.entity_sport.token}`
    );
    res.status(200).json(resp.data);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return next(new AppError("Match not found", 404));
    }
    next(error);
  }
};

/**
 * GET /api/v1/fixture/standings?cid=1600
 * Proxies Entity Sport competition standings endpoint.
 */
export const proxyStandings: RequestHandler = async (req, res, next) => {
  try {
    const cid = req.query.cid || "1600";
    const resp = await axios.get(
      `${configs.entity_sport.url}/competition/${cid}?token=${configs.entity_sport.token}`
    );
    res.status(200).json(resp.data);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return next(new AppError("Competition not found", 404));
    }
    next(error);
  }
};
