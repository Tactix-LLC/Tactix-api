import axios from "axios";
import configs from "../../../configs";

import AppError from "../../../utils/app_error";
import { Player } from "../dto";

export default async (matchId: string) => {
  try {
    // Fetch the latest players from match fantasy endpoint
    const latestPlayers: Player[] = [];

    const match = await axios.get(
      `${configs.entity_sport.url}/matches/${matchId}/newfantasy?token=${configs.entity_sport.token}`
    );

    if (match.data.status !== "ok")
      throw new AppError("Unable to fetch data", 400);

    // Use raw player stats instead of pre-calculated fantasy points
    // This ensures we can apply our own FPL-compliant calculation
    const homeStats = match.data.response.items.playerstats?.home || [];
    const awayStats = match.data.response.items.playerstats?.away || [];
    const homeTeamName = match.data.response.items.match_info?.teams?.home?.tname || "Home";
    const awayTeamName = match.data.response.items.match_info?.teams?.away?.tname || "Away";

    if (homeStats.length === 0 && awayStats.length === 0) {
      return [];
    }

    // Convert raw stats to Player format and add to latestPlayers
    const convertStatsToPlayer = (stats: any[], teamName: string): Player[] => {
      return stats.map(stat => ({
        pid: stat.pid.toString(),
        pname: stat.pname,
        role: stat.role,
        tname: teamName,
        point: 0, // Will be calculated by our FPL system
        blockedshot: stat.blockedshot || 0,
        clearance: stat.clearance || 0,
        shotssaved: stat.shotssaved || 0,
        penaltysaved: stat.penaltysaved || 0,
        goalscored: stat.goalscored || 0,
        goalsconceded: stat.goalsconceded || 0,
        minutesplayed: stat.minutesplayed || 0,
        cleansheet: stat.cleansheet || 0,
        assist: stat.assist || 0,
        passes: stat.passes || 0,
        shotsontarget: stat.shotsontarget || 0,
        tacklesuccessful: stat.tacklesuccessful || 0,
        yellowcard: stat.yellowcard || 0,
        redcard: stat.redcard || 0,
        owngoal: stat.owngoal || 0,
        penaltymissed: stat.penaltymissed || 0,
        chancecreated: stat.chancecreated || 0,
        starting11: stat.starting11 || 0,
        substitute: stat.substitute || 0,
        interceptionwon: stat.interceptionwon || 0,
      }));
    };

    latestPlayers.push(...convertStatsToPlayer(homeStats, homeTeamName));
    latestPlayers.push(...convertStatsToPlayer(awayStats, awayTeamName));

    return latestPlayers;
  } catch (error) {
    throw error;
  }
};
