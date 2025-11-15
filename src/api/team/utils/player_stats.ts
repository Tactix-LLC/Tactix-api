import axios from "axios";
import configs from "../../../configs";

import AppError from "../../../utils/app_error";
import { Player } from "../../game_week/dto";

export default async (matchIds: string[]) => {
  try {
    // Fetch the latest players from match fantasy endpoint
    const playerStats: Player[] = [];

    // Generate URLs
    const urls: string[] = [];
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
        const homeStats = stat.data.response.items.playerstats.home;
        const awayStats = stat.data.response.items.playerstats.away;
        
        // Home team
        const homeTeam: { tname: string } = stat.data.response.items.match_info.teams.home;
        // Away team
        const awayTeam: { tname: string } = stat.data.response.items.match_info.teams.away;

        // Home team players (to get roles)
        const homeTeamPlayers: { pid: string; pname: string; role: string }[] = 
          stat.data.response.items.teams.home;
        // Away team players (to get roles)
        const awayTeamPlayers: { pid: string; pname: string; role: string }[] = 
          stat.data.response.items.teams.away;

        // Create role lookup object
        const playersRoleObj: { [key: string]: { role: string; tname: string } } = {};
        
        homeTeamPlayers.forEach((player) => {
          playersRoleObj[player.pid] = {
            role: player.role,
            tname: homeTeam.tname,
          };
        });
        
        awayTeamPlayers.forEach((player) => {
          playersRoleObj[player.pid] = {
            role: player.role,
            tname: awayTeam.tname,
          };
        });

        // Add roles and team names to player stats
        homeStats.forEach((player: any) => {
          if (playersRoleObj[player.pid]) {
            player.role = playersRoleObj[player.pid].role;
            player.tname = playersRoleObj[player.pid].tname;
          }
        });
        
        awayStats.forEach((player: any) => {
          if (playersRoleObj[player.pid]) {
            player.role = playersRoleObj[player.pid].role;
            player.tname = playersRoleObj[player.pid].tname;
          }
        });
        
        playerStats.push(...homeStats);
        playerStats.push(...awayStats);
      }
    });

    return playerStats;
  } catch (error) {
    throw error;
  }
};
