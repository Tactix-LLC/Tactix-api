import Perk from "./model";
import IPerkDoc from "./dto";

// Data access layer for perk
export default class PerkDAL {
  // Create perk
  static async createPerk(data: {
    perk_name: string;
    number_of_usage: number;
    week_or_year: string;
  }): Promise<IPerkDoc> {
    try {
      const perk = await Perk.create(data);
      return perk;
    } catch (error) {
      throw error;
    }
  }

  // Get all Perks
  static async getAllPerks(): Promise<IPerkDoc[]> {
    try {
      const perks = await Perk.find();
      return perks;
    } catch (error) {
      throw error;
    }
  }

  // Get all Perks
  static async getPerks(): Promise<IPerkDoc[]> {
    try {
      const perks = await Perk.find({ status: true });
      return perks;
    } catch (error) {
      throw error;
    }
  }

  // Get a perk
  static async getPerk(id: string): Promise<IPerkDoc | null> {
    try {
      const perk = await Perk.findById(id);
      return perk;
    } catch (error) {
      throw error;
    }
  }

  // Get a perk
  static async getPerkByName(perkName: string): Promise<IPerkDoc | null> {
    try {
      const perk = await Perk.findOne({ perk_name: perkName });
      return perk;
    } catch (error) {
      throw error;
    }
  }

  // Update perk
  static async updatePerk(
    id: string,
    data: {
      perk_name?: string;
      number_of_usage?: number;
      week_or_year?: string;
    }
  ): Promise<IPerkDoc | null> {
    try {
      const perk = await Perk.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return perk;
    } catch (error) {
      throw error;
    }
  }

  // Update perk status
  static async updatePerkStatus(
    id: string,
    data: { status: boolean }
  ): Promise<IPerkDoc | null> {
    try {
      const perk = await Perk.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return perk;
    } catch (error) {
      throw error;
    }
  }

  // Delete perk
  static async deletePerk(id: string): Promise<void> {
    try {
      await Perk.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete all perks
  static async deleteAllPerks() {
    try {
      await Perk.deleteMany();
    } catch (error) {
      throw error;
    }
  }
}
