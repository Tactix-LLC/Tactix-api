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

    if (Array.isArray(match.data.response.items.fantasy_points)) {
      if (match.data.response.items.fantasy_points.length === 0) {
        return [];
      }
    }

    latestPlayers.push(...match.data.response.items.fantasy_points.home);
    latestPlayers.push(...match.data.response.items.fantasy_points.away);

    return latestPlayers;
  } catch (error) {
    throw error;
  }
};
