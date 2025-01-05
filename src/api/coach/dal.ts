import Coach from "./model";
import ICoachDoc from "./dto";

// Data access layer for coach
export default class CoachDAL {
  // Create coach
  static async createCoach(data: {
    coach_name: string;
    coach_slugify_name: string;
    image_public_id: string;
    image_secure_url: string;
    is_major?: boolean;
  }): Promise<ICoachDoc> {
    try {
      const coach = await Coach.create(data);
      return coach;
    } catch (error) {
      throw error;
    }
  }

  // Get all Coaches
  static async getCoaches(): Promise<ICoachDoc[]> {
    try {
      const coaches = await Coach.find({ is_active: true });
      return coaches;
    } catch (error) {
      throw error;
    }
  }

  // Get all coaches
  static async getAllCoaches(): Promise<ICoachDoc[]> {
    try {
      const coaches = await Coach.find();
      return coaches;
    } catch (error) {
      throw error;
    }
  }

  // Get all major Coaches
  static async getMajorCoaches(): Promise<ICoachDoc[]> {
    try {
      const coaches = await Coach.find({ is_major: true });
      return coaches;
    } catch (error) {
      throw error;
    }
  }

  // Get every Coaches
  static async getEveryCoaches(): Promise<ICoachDoc[]> {
    try {
      const coaches = await Coach.find();
      return coaches;
    } catch (error) {
      throw error;
    }
  }

  // Get a coach
  static async getCoachById(id: string): Promise<ICoachDoc | null> {
    try {
      const coach = await Coach.findById(id);
      return coach;
    } catch (error) {
      throw error;
    }
  }

  // Get a coach
  static async getCoachByName(coachName: string): Promise<ICoachDoc | null> {
    try {
      const coach = await Coach.findOne({ coach_slugify_name: coachName });
      return coach;
    } catch (error) {
      throw error;
    }
  }

  // Update coach name
  static async updateCoachInfo(
    id: string,
    data: {
      coach_name: string;
      coach_slugify_name: string;
    }
  ): Promise<ICoachDoc | null> {
    try {
      const coach = await Coach.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return coach;
    } catch (error) {
      throw error;
    }
  }

  // Update coach image
  static async updateCoachImage(
    id: string,
    data: {
      image_public_id: string;
      image_secure_url: string;
    }
  ): Promise<ICoachDoc | null> {
    try {
      const coach = await Coach.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return coach;
    } catch (error) {
      throw error;
    }
  }

  // Update coach is active status
  static async updateCoachStatus(
    id: string,
    data: { is_active: boolean }
  ): Promise<ICoachDoc | null> {
    try {
      const coach = await Coach.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return coach;
    } catch (error) {
      throw error;
    }
  }

  // Update coach, is active status
  static async swapMajorCoach(data: {
    existingCoachId: string;
    newMajorCoachId: string;
  }): Promise<void> {
    try {
      //update existing coach
      await Coach.findByIdAndUpdate(
        data.existingCoachId,
        { is_major: false },
        {
          runValidators: true,
          new: true,
        }
      );

      //update new coach
      await Coach.findByIdAndUpdate(
        data.newMajorCoachId,
        { is_major: true },
        {
          runValidators: true,
          new: true,
        }
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete coach
  static async deleteCoach(id: string): Promise<void> {
    try {
      await Coach.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete all coaches
  static async deleteAllCoaches() {
    try {
      await Coach.deleteMany({ is_major: false });
    } catch (error) {
      throw error;
    }
  }
}
