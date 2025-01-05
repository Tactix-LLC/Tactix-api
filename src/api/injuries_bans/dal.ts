// Injury model
import APIFeatures from "../../utils/api_features";
import IInjuriesBanDoc, { IInjuriesBanPlayer } from "./dto";
import InjuriesBanModel from "./model";

// Injuries and bans services
export default class InjuriesBan {
  // Create an injuries and bans
  static async createInjuriesBan(data: {
    player: IInjuriesBanPlayer;
    state: string;
    injury_title?: string;
    chance: number;
  }): Promise<IInjuriesBanDoc> {
    try {
      const injuryBan = await InjuriesBanModel.create({
        player: data.player,
        state: data.state,
        injury_title: data.injury_title,
        chance: data.chance,
      });
      return injuryBan;
    } catch (error) {
      throw error;
    }
  }

  // Get all injuries and bans
  static async getAllInjuriesBan(): Promise<IInjuriesBanDoc[]> {
    try {
      const injuriesBans = await InjuriesBanModel.find();
      return injuriesBans;
    } catch (error) {
      throw error;
    }
  }

  // Get latest injuries and bans
  static async getAllLatestInjuriesBans(): Promise<IInjuriesBanDoc[]> {
    try {
      const injuriesBans = await InjuriesBanModel.find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      return injuriesBans;
    } catch (error) {
      throw error;
    }
  }

  // Get a single injury and ban
  static async getInjuryBanById(id: string): Promise<IInjuriesBanDoc | null> {
    try {
      const injuryBan = await InjuriesBanModel.findById(id);
      return injuryBan;
    } catch (error) {
      throw error;
    }
  }

  // Update injury and ban
  static async updateInjuryBan(data: {
    id: string;
    chance?: number;
    state?: string;
    injury_title?: string;
  }): Promise<IInjuriesBanDoc | null> {
    try {
      const injuryBan = await InjuriesBanModel.findByIdAndUpdate(
        data.id,
        {
          chance: data.chance,
          state: data.state,
          injury_title: data.injury_title,
        },
        { runValidators: true, new: true }
      );
      return injuryBan;
    } catch (error) {
      throw error;
    }
  }

  // Delete an injury and ban
  static async deleteInjuryBan(id: string): Promise<IInjuriesBanDoc | null> {
    try {
      const injuryBan = await InjuriesBanModel.findByIdAndDelete(id);
      return injuryBan;
    } catch (error) {
      throw error;
    }
  }

  // Delete all injuries and bans
  static async deleteAllInjuriesBans() {
    try {
      await InjuriesBanModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }
}
