import axios from "axios";
import configs from "../../../configs";

import AppError from "../../../utils/app_error";
import { Player } from "../../game_week/dto";

export default async (matchIds: string[]) => {
  try {
    // Fetch the latest players from match fantasy endpoint
    const playerStats: Player[] = [];

    // Generate URLs
    const urls = [];
    for (let i = 0; i < matchIds.length; i++) {
      urls.push(
        `${configs.entity_sport.url}/matches/${matchIds[i]}/newfantasy?token=${configs.entity_sport.token}`
      );
    }

    // Fetch the stat
    const result = await axios.all(urls.map((url) => axios.get(url)));

    // Stat
    result.forEach((stat) => {
      // Check if there is a player stat
      if (!Array.isArray(stat.data.response.items.playerstats)) {
        playerStats.push(...stat.data.response.items.playerstats.home);
        playerStats.push(...stat.data.response.items.playerstats.away);
      }
    });

    return playerStats;
  } catch (error) {
    throw error;
  }
};
