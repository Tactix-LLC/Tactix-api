import { IPlayersData } from "../dto";
import AppError from "../../../utils/app_error";

// Check max of 3 players are selected per club
export default function threePlayersPerClub(playersData: Array<IPlayersData>) {
  try {
    // Check max of 3 players/club are selected
    const clubCounts: { [key: string]: number } = {};
    playersData.forEach((player) => {
      const club = player.club;
      clubCounts[club] = (clubCounts[club] || 0) + 1;
    });

    // Convert the clubsCount object to an array
    const clubsCountArray = Object.values(clubCounts);

    // Check the counted values in the array are less than or equal to three
    const allClubsLessThanThree = clubsCountArray.every((club) => club <= 3);
    if (!allClubsLessThanThree) {
      throw new AppError(
        "You can not select more than three players from a club",
        400
      );
    }
  } catch (error) {
    throw error;
  }
}
