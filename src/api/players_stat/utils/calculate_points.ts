import { Player } from "../../game_week/dto";
import { IPlayerStat } from "../dto";
import calculateFPLPoints from "./calculate_points_fpl";

/**
 * Calculate fantasy points using FPL-compatible system
 * This replaces the old point calculation with the new FPL system
 */
export default async (playerStat: Player[]): Promise<IPlayerStat[]> => {
  // Use the new FPL-compatible point calculation system
  return await calculateFPLPoints(playerStat);
};