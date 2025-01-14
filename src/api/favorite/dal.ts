import IFavoriteDoc from "./dto";
import FavoriteModel from "./model";

// Favorite service
export default class Favorite {
  // create Favorite
  static async AddPlayer(data: {
    player_id: string;
    client_id: string;
    player_name: string;
    position: string;
    team: string;
    player_number: string;
    club_logo: string;
  }): Promise<IFavoriteDoc> {
    try {
      const favorite = await FavoriteModel.create(data);
      return favorite;
    } catch (error) {
      throw error;
    }
  }

  // remove Player from favorites by id
  static async removePlayerByPlayerId(payload: {
    player_id: string;
    client_id: string;
  }): Promise<void> {
    try {
      await FavoriteModel.deleteOne({
        $and: [
          { client_id: payload.client_id },
          { player_id: payload.player_id },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  // remove player from watch list by id
  static async checkPlayerExists(payload: {
    client_id: string;
    player_id: string;
  }): Promise<IFavoriteDoc | null> {
    try {
      const playerData = await FavoriteModel.findOne({
        $and: [
          { client_id: payload.client_id },
          { player_id: payload.player_id },
        ],
      });
      return playerData;
    } catch (error) {
      throw error;
    }
  }

  // check player exists from favorite by id
  static async getPlayerByClientAndPlayerId(payload: {
    clientId: string;
    playerId: string;
  }): Promise<void> {
    try {
      await FavoriteModel.findOne({
        $and: [
          { client_id: payload.clientId },
          { player_id: payload.playerId },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  // Get favoirte by ID
  static async getPlayerDataById(id: string): Promise<IFavoriteDoc | null> {
    try {
      const favorite = await FavoriteModel.findById(id);
      if (favorite) return favorite;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get player by Client ID
  static async getPlayerByClientId(
    id: string
  ): Promise<Array<IFavoriteDoc | null>> {
    try {
      const favorite = await FavoriteModel.find({ client_id: id });
      return favorite;
    } catch (error) {
      throw error;
    }
  }

  // Get player by player ID
  static async getByPlayerId(
    player_id: string
  ): Promise<Array<IFavoriteDoc | null>> {
    try {
      const favorite = await FavoriteModel.find({ player_id });
      return favorite;
    } catch (error) {
      throw error;
    }
  }
}
