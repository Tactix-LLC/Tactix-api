import ScoutModel from "./model";
import IScoutDoc from "./dto";

// Scout service
export default class Scout {
  // Create Scout
  static async AddPlayer(data: {
    player_id: string;
    client_id: string;
    player_name: string;
    position: string;
    team: string;
    player_number: string;
    club_logo: string;
  }): Promise<IScoutDoc> {
    try {
      const scout = await ScoutModel.create(data);
      return scout;
    } catch (error) {
      throw error;
    }
  }

  // remove player from watch list by id
  static async removePlayerByPlayerId(payload: {
    client_id: string;
    player_id: string;
  }): Promise<void> {
    try {
      await ScoutModel.deleteOne({
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
  }): Promise<IScoutDoc | null> {
    try {
      const playerData = await ScoutModel.findOne({
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

  // remove player from watch list by id
  static async getPlayerByClientAndPlayerId(payload: {
    clientId: string;
    playerId: string;
  }): Promise<void> {
    try {
      await ScoutModel.findOne({
        $and: [
          { client_id: payload.clientId },
          { player_id: payload.playerId },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  // Get scout by ID
  static async getPlayerDataById(id: string): Promise<IScoutDoc | null> {
    try {
      const scout = await ScoutModel.findById(id);
      if (scout) return scout;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get player by Client ID
  static async getPlayerByClientId(
    id: string
  ): Promise<Array<IScoutDoc | null>> {
    try {
      const scout = await ScoutModel.find({ client_id: id });
      return scout;
    } catch (error) {
      throw error;
    }
  }

  // Get player by player ID
  static async getByPlayerId(
    player_id: string
  ): Promise<Array<IScoutDoc | null>> {
    try {
      const scout = await ScoutModel.find({ player_id });
      return scout;
    } catch (error) {
      throw error;
    }
  }
}
