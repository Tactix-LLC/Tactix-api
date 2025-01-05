import { IPlayersData } from "../dto";
import AppError from "../../../utils/app_error";

// Check there're 11 players selected
export default function elevenPlayersRules(playersData: Array<IPlayersData>) {
  try {
    // Check there's only one captain
    const captain = playersData.filter((player) => player.is_captain === true);

    if (captain.length > 1 || captain.length < 1) {
      throw new AppError("You must have only one captain", 400);
    }

    // Check there's only one vice captain
    const viceCaptain = playersData.filter(
      (player) => player.is_vice_captain === true
    );
    if (viceCaptain.length > 1 || viceCaptain.length < 1) {
      throw new AppError("You must have only one vice captain", 400);
    }

    // Check 1 player is not captain and vice captain at the same time
    if (captain[0].pid === viceCaptain[0].pid) {
      throw new AppError("One player can not be captain and vice captain", 400);
    }

    const elevenPlayers = playersData.filter((player) => !player.is_bench);

    // Check captain and vice captain are available
    if (
      !elevenPlayers.some((player) => player.is_captain === true) ||
      !elevenPlayers.some((player) => player.is_vice_captain === true)
    ) {
      throw new AppError("Please select one captain and one vice captain", 400);
    }

    // Check there's only one goal keeper
    const goalKeeper = elevenPlayers.filter((player) => {
      return player.position === "Goalkeeper";
    });

    if (goalKeeper.length !== 1)
      throw new AppError("Please select only one goal keeper", 400);

    // Check there's minimum of 3 and maximum of 5 selected defenders
    const defenders = elevenPlayers.filter((player) => {
      return player.position === "Defender";
    });

    if (defenders.length < 3 || defenders.length > 5) {
      throw new AppError(
        "You must have between 3 and 5 selected defenders",
        400
      );
    }

    // Check there's a minimum of 3 and maximum of 5 selected midfielders
    const midfielders = elevenPlayers.filter((player) => {
      return player.position === "Midfielder";
    });
    if (midfielders.length < 2 || midfielders.length > 5) {
      throw new AppError(
        "You must have between 2 and 5 selected midfielders",
        400
      );
    }

    // Check there's a minimum of 1 and max of 3 selected forwards
    const forwards = elevenPlayers.filter((player) => {
      return player.position === "Forward";
    });
    if (forwards.length < 1 || forwards.length > 3) {
      throw new AppError("You must have between 1 and 3 forwards", 400);
    }
  } catch (error) {
    throw error;
  }
}
