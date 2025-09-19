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

    // Function to validate and clean player data
    const validateAndAddPlayers = (teamPlayers: any[], team: ITeam) => {
      teamPlayers.forEach((player) => {
        // Handle potential different field names and null/undefined values
        const playerName = player.pname || player.fullname || player.name || '';
        const playerRole = player.role || player.positionname || player.position || '';
        const playerId = player.pid || player.id || '';

        // More robust validation - check for null, undefined, empty string, and whitespace
        const isValidName = playerName && 
                           typeof playerName === 'string' && 
                           playerName.trim().length > 0 &&
                           playerName.trim() !== 'null' &&
                           playerName.trim() !== 'undefined';
        
        const isValidRole = playerRole && 
                           typeof playerRole === 'string' && 
                           playerRole.trim().length > 0 &&
                           playerRole.trim() !== 'null' &&
                           playerRole.trim() !== 'undefined';
        
        const isValidId = playerId && 
                         typeof playerId === 'string' && 
                         playerId.trim().length > 0 &&
                         playerId.trim() !== 'null' &&
                         playerId.trim() !== 'undefined';

        // Skip players with invalid data
        if (!isValidName || !isValidRole || !isValidId) {
          console.log(`Skipping invalid player from match ${matchId} - Name: "${playerName}", Role: "${playerRole}", ID: "${playerId}"`);
          return;
        }

        // Create validated player object
        const validatedPlayer: IPlayer = {
          pid: playerId.trim(),
          pname: playerName.trim(),
          role: playerRole.trim(),
          rating: (player.rating || player.fantasy_player_rating || "").toString(),
          prev_rating: player.prev_rating || "",
          team: team,
        };

        players.push(validatedPlayer);
      });
    };

    // Add team players with validation
    validateAndAddPlayers(homePlayers, homeTeam);
    validateAndAddPlayers(awayPlayers, awayTeam);

    console.log(`Match ${matchId}: Found ${players.length} valid players after filtering`);

    return players;
  } catch (error) {
    throw error;
  }
};
