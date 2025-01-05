import SeasonModel from "./model";
import ISeasonDoc from "./dto";

// Data access layer for about-us data
export default class Season {
  // Create game season
  static async createSeason(
    data: SeasonRequest.ICreateSeasonInput & { season_id: string }
  ): Promise<ISeasonDoc> {
    try {
      const season = await SeasonModel.create({
        name: data.name,
        season_id: data.season_id,
      });

      // Return create season
      return season;
    } catch (error) {
      throw error;
    }
  }

  // Get all active game season
  static async getAll(): Promise<ISeasonDoc[]> {
    try {
      const season = await SeasonModel.find({ is_active: true }).populate({
        path: "competitions",
        select: "competition_name competition_slug cid logo is_active status",
      });
      return season;
    } catch (error) {
      throw error;
    }
  }

  // Get every seasons from database
  static async getEverySeason(): Promise<ISeasonDoc[]> {
    try {
      const season = await SeasonModel.find().populate({
        path: "competitions",
        select: "competition_name competition_slug cid logo is_active status",
      });
      return season;
    } catch (error) {
      throw error;
    }
  }

  // Find by id
  static async getById(id: string): Promise<ISeasonDoc | null> {
    try {
      const season = await SeasonModel.findById(id);
      if (season) return season;

      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update season
  static async updateSeason(
    data: SeasonRequest.IUpdateSeasonInput & { id: string }
  ): Promise<ISeasonDoc | null> {
    try {
      const season = await SeasonModel.findByIdAndUpdate(
        data.id,
        {
          name: data.name,
          season_id: data.season_id,
        },
        { runValidators: true, new: true }
      );

      return season;
    } catch (error) {
      throw error;
    }
  }

  // Update status
  static async updateStatus(
    data: SeasonRequest.IUpdateSeasonStatusInput & { id: string }
  ): Promise<ISeasonDoc | null> {
    try {
      const season = await SeasonModel.findByIdAndUpdate(
        data.id,
        { is_active: data.is_active },
        { runValidators: true, new: true }
      );
      if (season) return season;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Delete all seasons
  static async deleteAllSeasons() {
    try {
      await SeasonModel.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Find season by sid
  static async getSeasonBySid(sid: string): Promise<ISeasonDoc | null> {
    try {
      const season = await SeasonModel.findOne({ season_id: sid }).populate({
        path: "competitions",
        select: "competition_name competition_slug cid logo is_active status",
      });
      return season;
    } catch (error) {
      throw error;
    }
  }
}
