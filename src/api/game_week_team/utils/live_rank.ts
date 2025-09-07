import GameWeekTeam from "../dal";
import calculate_fantasy_points from "../../team/utils/calculate_fantasy_points";
import calculate_points from "./calculate_point";
import cron from "node-cron";
import schedule from "node-schedule";
import IGameWeekDoc from "../../game_week/dto";
import configs from "../../../configs";
import axios from "axios";
import { Player } from "../../game_week/dto";

export default (data: {
  gameWeek: IGameWeekDoc;
  count: number;
  time_interval: Date;
}) => {
  // Check if there are team created under this game week
  if (data.count > 0) {
    const job = schedule.scheduleJob(`${data.time_interval}`, async () => {
      try {
        console.log("Hello. Cron job starts");
        // Get the match IDS
        const matchIds = data.gameWeek.match_ids;

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
        const playerStat: Player[] = [];
        result.forEach((stat) => {
          // Check if there is a player stat
          if (!Array.isArray(stat.data.response.items.playerstats)) {
            playerStat.push(...stat.data.response.items.playerstats.home);
            playerStat.push(...stat.data.response.items.playerstats.away);

            // Home team
            const homeTeam: { tname: string } =
              stat.data.response.items.match_info.teams.home;
            // Away team
            const awayTeam: { tname: string } =
              stat.data.response.items.match_info.teams.away;

            // Home team players
            const homeTeamPlayers: [
              { pid: string; pname: string; role: string; tname: string }
            ] = stat.data.response.items.teams.home;
            homeTeamPlayers.forEach((player) => {
              player.tname = homeTeam.tname;
            });

            // Away team players
            const awayTeamPlayers: [
              { pid: string; pname: string; role: string; tname: string }
            ] = stat.data.response.items.teams.away;
            awayTeamPlayers.forEach((player) => {
              player.tname = awayTeam.tname;
            });

            // Player roles
            const playersRoles: {
              pid: string;
              role: string;
              tname: string;
            }[] = [];
            playersRoles.push(...homeTeamPlayers);
            playersRoles.push(...awayTeamPlayers);

            // Players roles object
            const playersRoleObj: {
              [key: string]: { role: string; tname: string };
            } = {};
            playersRoles.forEach((player) => {
              playersRoleObj[player.pid] = {
                role: player.role,
                tname: player.tname,
              };
            });

            // Add roles
            playerStat.forEach((player) => {
              if (playersRoleObj[player.pid]) {
                player.role = playersRoleObj[player.pid].role;
                player.tname = playersRoleObj[player.pid].tname;
              }
            });
          }
        });

        console.log(playerStat[playerStat.length - 1]);

        // Page
        let page = Math.floor(data.count / 10);
        if (data.count % 10 !== 0) {
          page += 1;
        }

        // Loop on the whole teams that joined this specific game week and update the points
        for (let i = 1; i <= page; i++) {
          console.log(i);
          const gameWeekTeams = await GameWeekTeam.getGameweekTeamsForPoint(
            data.gameWeek._id,
            i
          );
          gameWeekTeams.forEach(async (gameWeekTeam) => {
            // Calculate player points
            const playersPoints = await calculate_fantasy_points(
              gameWeekTeam.players,
              playerStat
            );

            const { totalPoint, players } = await calculate_points(playersPoints);

            // Update the team with the latest points
            const updatedGameWeekTeam =
              await GameWeekTeam.updateTotalGameWeekPointAndPlayers({
                id: gameWeekTeam._id,
                total_point: totalPoint,
                players: players,
              });
          });
        }
        job.cancel();
      } catch (error) {
        throw error;
      }
    });
    return job;
  }
};
