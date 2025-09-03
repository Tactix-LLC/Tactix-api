import { Player } from "../../game_week/dto";
import { IPlayersData } from "../dto";
import calculateFPLPoints from "../../system_settings/utils/calculate_fpl_points_legacy";

/**
 * Calculate fantasy points using FPL-compatible system
 * This replaces the old point calculation with the new FPL system
 */
export default async (
  players: IPlayersData[],
  playerStat: Player[]
): Promise<IPlayersData[]> => {
  // Use the new FPL-compatible point calculation system
  return await calculateFPLPoints(players, playerStat);
};