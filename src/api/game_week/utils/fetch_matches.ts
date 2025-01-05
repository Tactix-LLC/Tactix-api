import axios from "axios";
import configs from "../../../configs";
import AppError from "../../../utils/app_error";

export default async (data: { cid: string; game_week: string }) => {
  try {
    // Fetch the all players from Entity sport
    const matches = await axios.get(
      `${configs.entity_sport.url}/competition/${data.cid}/matches?token=${configs.entity_sport.token}&paged=${data.game_week}`
    );
    if (matches.data.status !== "ok")
      throw new AppError("Unable to fetch matches", 400);

    // Fetch the match IDS
    const matchIds = matches.data.response.items.map(
      (match: { mid: string }) => match.mid
    );

    return matchIds;
  } catch (error) {
    throw error;
  }
};
