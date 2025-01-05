import Competition from "./model";
import ICompetitionDoc from "./dto";

// Data access layer for competition
export default class CompetitionDAL {
  // Create competition
  static async createComp(data: any): Promise<ICompetitionDoc> {
    try {
      const competition = await Competition.create(data);
      return competition;
    } catch (error) {
      throw error;
    }
  }

  // Get all competetions
  static async getAllCompetitions(): Promise<ICompetitionDoc[]> {
    try {
      const competetions = await Competition.find();
      return competetions;
    } catch (error) {
      throw error;
    }
  }

  // Get competitions by season
  static async getCompsBySeason(season_id: string): Promise<ICompetitionDoc[]> {
    try {
      const competetions = await Competition.find({ season: season_id });
      return competetions;
    } catch (error) {
      throw error;
    }
  }

  // Get a competition
  static async getCompetition(id: string): Promise<ICompetitionDoc | null> {
    try {
      const competition = await Competition.findById(id);
      return competition;
    } catch (error) {
      throw error;
    }
  }

  // Update competition
  static async updateCompetition(
    id: string,
    data: {
      competition_name: string;
      competition_slug: string;
      cid: string;
      logo: string;
      start_date: Date;
      end_date: Date;
    }
  ): Promise<ICompetitionDoc | null> {
    try {
      const competition = await Competition.findByIdAndUpdate(
        id,
        {
          competition_name: data.competition_name,
          competition_slug: data.competition_slug,
          cid: data.cid,
          logo: data.logo,
          start_date: data.start_date,
          end_data: data.end_date,
        },
        {
          runValidators: true,
          new: true,
        }
      );
      return competition;
    } catch (error) {
      throw error;
    }
  }

  // Update competition status
  static async updateCompStatus(
    id: string,
    data: CompetitionRequest.IUpdateCompetitionStatusInput
  ): Promise<ICompetitionDoc | null> {
    try {
      const competition = await Competition.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return competition;
    } catch (error) {
      throw error;
    }
  }

  // Delete competition
  static async deleteCompetition(id: string): Promise<ICompetitionDoc | null> {
    try {
      const competition = await Competition.findByIdAndDelete(id);
      return competition;
    } catch (error) {
      throw error;
    }
  }

  // Delete all competitions
  static async deleteAllComps() {
    try {
      await Competition.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Update sid of all competitions
  static async updateSidOfAllCompetitions(season: string, newSid: string) {
    try {
      const competetions = await Competition.updateMany(
        { season: season },
        { $set: { sid: newSid } }
      );
      // return competetions.acknowledged;
    } catch (error) {
      throw error;
    }
  }

  // Get competition by cid
  static async getCompetitionByCid(
    cid: string
  ): Promise<ICompetitionDoc | null> {
    try {
      const competetion = await Competition.findOne({ cid });
      return competetion;
    } catch (error) {
      throw error;
    }
  }

  // Get competition by slug
  static async getBySlug(slug: string): Promise<ICompetitionDoc | null> {
    try {
      const competition = await Competition.findOne({ competition_slug: slug });
      return competition;
    } catch (error) {
      throw error;
    }
  }
}
