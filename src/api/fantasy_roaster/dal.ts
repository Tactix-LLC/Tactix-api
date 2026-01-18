import IFantasyRoasterDoc, { IPlayer } from "./dto";
import FantasyRoasterModel from "./model";

import init from "../../index";
import AppError from "../../utils/app_error";

// Fantasy Roaster Service
export default class FantasyRoaster {
  // Create a fantasy roaster
  static async createFantasyRoaster(
    data: FantasyRoasterRequest.ICreateFantasyRoasterInput
  ): Promise<IFantasyRoasterDoc> {
    try {
      const fantasyRoaster = await FantasyRoasterModel.create({
        season_name: data.season_name,
        season_id: data.season_id,
        competition_id: data.competition_id,
        competition_cid: data.competition_cid,
        players: data.players,
      });
      return fantasyRoaster;
    } catch (error) {
      throw error;
    }
  }

  // Get a fantasy roaster
  static async getFantasyRoaster(): Promise<IFantasyRoasterDoc[]> {
    try {
      const fantasyRoasters = await FantasyRoasterModel.find({
        is_active: true,
      });
      return fantasyRoasters;
    } catch (error) {
      throw error;
    }
  }

  // Get all fantasy roaster
  static async getEveryFantasyRoaster(): Promise<IFantasyRoasterDoc[]> {
    try {
      const fantasyRoasters = await FantasyRoasterModel.find();
      return fantasyRoasters;
    } catch (error) {
      throw error;
    }
  }

  // Get a single roaster
  static async getSingleRoaster(
    id: string
  ): Promise<IFantasyRoasterDoc | null> {
    try {
      const roaster = await FantasyRoasterModel.findById(id);
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Get cached roaster
  static async getCachedRoaster(season_name: string) {
    try {
      const roaster = await init.redis_client.hGetAll(`otp_${season_name}`);
      return roaster as unknown as {
        season_name: string;
        is_active: string;
        createdAt: string;
        updatedAt: string;
        players: string;
      };
    } catch (error) {
      throw error;
    }
  }

  // Cache active roaster
  static async cacheActiveRoaster(data: IFantasyRoasterDoc) {
    try {
      const roaster = await init.redis_client.sendCommand([
        "HSET",
        `season_${data.season_name}`,
        "id",
        data.id,
        "season_name",
        data.season_name,
        "is_active",
        `${data.is_active}`,
        "players",
        `${data.players.toString()}`,
        "createdAt",
        `${data.createdAt}`,
        "updatedAt",
        `${data.updatedAt}`,
      ]);
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Update price
  static async updatePlayerPrice(data: {
    pid: string;
    rating: number;
    id: string;
  }) {
    try {
      const fantasyRoaster = await FantasyRoasterModel.updateOne(
        { _id: data.id, "players.pid": data.pid },
        {
          $set: { "players.$.rating": data.rating, "players.$.is_new": false },
        },
        { runValidators: true, new: true }
      );
      return fantasyRoaster;
    } catch (error) {
      throw error;
    }
  }

  // Update player's team
  static async updatePlayerTeam(data: {
    id: string;
    pid: string;
    team: {
      tid: string;
      tname: string;
      logo: string;
      fullname: string;
      abbr: string;
    };
  }) {
    try {
      const fantasyRoaster = await FantasyRoasterModel.updateOne(
        { _id: data.id, "players.pid": data.pid },
        { $set: { "players.$.team": data.team } },
        { runValidators: true, new: true }
      );
      return fantasyRoaster;
    } catch (error) {
      throw error;
    }
  }

  // Update player info (name, position, club, rating)
  static async updatePlayerInfo(data: {
    id: string;
    pid: string;
    pname?: string;
    role?: string;
    team?: {
      tid: string;
      tname: string;
      logo: string;
      fullname: string;
      abbr: string;
    };
    rating?: number;
  }) {
    try {
      const updateFields: any = {};
      
      if (data.pname !== undefined) {
        updateFields["players.$.pname"] = data.pname;
      }
      if (data.role !== undefined) {
        // Normalize role from abbreviation to full name
        // Fantasy roaster should store full role names: Goalkeeper, Defender, Midfielder, Forward
        const roleMap: { [key: string]: string } = {
          'GK': 'Goalkeeper',
          'DEF': 'Defender',
          'MID': 'Midfielder',
          'FWD': 'Forward',
          'Goalkeeper': 'Goalkeeper',
          'Defender': 'Defender',
          'Midfielder': 'Midfielder',
          'Forward': 'Forward'
        };
        const normalizedRole = roleMap[data.role.toUpperCase()] || roleMap[data.role] || data.role;
        updateFields["players.$.role"] = normalizedRole;
      }
      if (data.team !== undefined) {
        updateFields["players.$.team"] = data.team;
      }
      if (data.rating !== undefined) {
        updateFields["players.$.rating"] = data.rating.toString();
        updateFields["players.$.is_new"] = false;
      }

      const fantasyRoaster = await FantasyRoasterModel.updateOne(
        { _id: data.id, "players.pid": data.pid },
        { $set: updateFields },
        { runValidators: true, new: true }
      );
      return fantasyRoaster;
    } catch (error) {
      throw error;
    }
  }

  // Update Transfer Radar
  static async updateTransferRadar(data: {
    transfer_radar: boolean;
    pid: string;
    id: string;
  }) {
    try {
      const fantasyRoaster = await FantasyRoasterModel.updateOne(
        {
          _id: data.id,
          "players.pid": data.pid,
        },
        { $set: { "players.$.transfer_radar": data.transfer_radar } },
        { runValidators: true, new: true }
      );
      return fantasyRoaster;
    } catch (error) {
      throw error;
    }
  }

  // Update roaster status
  static async updateRoasterStatus(data: {
    is_active: boolean;
    id: string;
  }): Promise<IFantasyRoasterDoc | null> {
    try {
      const roaster = await FantasyRoasterModel.findByIdAndUpdate(
        data.id,
        { is_active: data.is_active },
        { runValidators: true, new: true }
      );
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Add a player on the roaster
  static async addPlayer(
    data: { id: string } & FantasyRoasterRequest.IAddPlayer
  ) {
    try {
      const roaster = await FantasyRoasterModel.findByIdAndUpdate(
        data.id,
        {
          $push: {
            players: {
              pid: data.pid,
              pname: data.pname,
              role: data.role,
              rating: data.rating,
              team: {
                tid: data.tid,
                tname: data.tname,
                logo: data.logo,
                fullname: data.fullname,
                abbr: data.abbr,
              },
            },
          },
        },
        { runValidators: true, new: true }
      );
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Remove a player from roaster
  static async removePlayer(
    id: string,
    pid: string
  ): Promise<IFantasyRoasterDoc | null> {
    try {
      const roaster = await FantasyRoasterModel.findByIdAndUpdate(id, {
        $pull: { players: { pid } },
      });
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Update a player injury or ban status
  static async updateInjuryBanStatus(data: {
    pid: string;
    is_injuried?: boolean;
    is_banned?: boolean;
  }): Promise<IFantasyRoasterDoc | null> {
    try {
      // Active Roaster
      const activeRoaster = await FantasyRoaster.getFantasyRoaster();
      if (activeRoaster.length === 0)
        throw new AppError("There is no active roaster", 400);

      const roaster = await FantasyRoasterModel.findOneAndUpdate(
        {
          _id: activeRoaster[0]._id,
          "players.pid": data.pid,
        },
        {
          $set: {
            "players.$.is_injuried": data.is_injuried,
            "players.$.is_banned": data.is_banned,
          },
        },
        { runValidators: true, new: true }
      );
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Reset Injury and Ban status of the players
  static async resetInjuryBanStatus(): Promise<IFantasyRoasterDoc | null> {
    try {
      // Active Roaster
      const activeRoaster = await FantasyRoaster.getFantasyRoaster();
      if (activeRoaster.length === 0)
        throw new AppError("There is no active roaster", 400);

      const roaster = await FantasyRoasterModel.findOneAndUpdate(
        {
          _id: activeRoaster[0]._id,
        },
        {
          $set: {
            "players.$.is_injuried": false,
            "players.$.is_banned": false,
          },
        },
        { runValidators: true, new: true }
      );
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Delete a roaster
  static async deleteRoaster(id: string): Promise<IFantasyRoasterDoc | null> {
    try {
      const roaster = await FantasyRoasterModel.findByIdAndDelete(id);
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Delete all roasters
  static async deleteRoasters() {
    try {
      await FantasyRoasterModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }

  // Delete cached data from redis
  static async deleteCachedRoaster(season_name: string) {
    try {
      await init.redis_client.del(`otp_${season_name}`);
    } catch (error) {
      throw error;
    }
  }

  // Get single roaster by season and competition
  static async getSingleRoasterBySeasonAndCompetition(season_id: string, competition_id: string): Promise<IFantasyRoasterDoc | null> {
    try {
      const roaster = await FantasyRoasterModel.findOne({
        season_id,
        competition_id,
      });
      return roaster;
    } catch (error) {
      throw error;
    }
  }

  // Update roaster players
  static async updateRoasterPlayers(roasterId: string, players: IPlayer[]): Promise<IFantasyRoasterDoc | null> {
    try {
      const updatedRoaster = await FantasyRoasterModel.findByIdAndUpdate(
        roasterId,
        { players },
        { new: true }
      );
      return updatedRoaster;
    } catch (error) {
      throw error;
    }
  }
}
