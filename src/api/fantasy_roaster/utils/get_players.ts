import axios from "axios";
import configs from "../../../configs";

// App Rrror
import AppError from "../../../utils/app_error";

// Player
import { IPlayer, ITeam } from "../dto";

export default async (matchId: string): Promise<IPlayer[]> => {
  try {
    // Fetch the latest players from match fantasy endpoint
    const players: IPlayer[] = [];

    const match = await axios.get(
      `${configs.entity_sport.url}/matches/${matchId}/newfantasy?token=${configs.entity_sport.token}`
    );

    if (match.data.status !== "ok")
      throw new AppError("Unable to fetch data", 400);

    // Get the teams
    const homeTeam: ITeam = match.data.response.items.match_info.teams.home;
    const awayTeam: ITeam = match.data.response.items.match_info.teams.away;

    // Get the players from both home and away
    const homePlayers: IPlayer[] = match.data.response.items.teams.home;
    const awayPlayers: IPlayer[] = match.data.response.items.teams.away;

    // Add team on the players object and push it to the players array
    homePlayers.forEach((player) => {
      player.team = homeTeam;
      players.push(player);
    });

    awayPlayers.forEach((player) => {
      player.team = awayTeam;
      players.push(player);
    });

    return players;
  } catch (error) {
    throw error;
  }
};
