import FeedbackTitleModel from "./model";
import IFeedbackTitleDoc from "./dto";

// Data access layer for feedback title data
export default class FeedbackTitle {
  // Create feedback title title
  static async createFeedbackTitle(
    data: FeedbackTitleRequest.ICreateFeedbackTitleInput
  ): Promise<IFeedbackTitleDoc> {
    try {
      let feedbackTitle: IFeedbackTitleDoc;
      if (data.major) {
        feedbackTitle = await FeedbackTitleModel.create({
          title: data.title,
          major: data.major,
        });
      } else {
        feedbackTitle = await FeedbackTitleModel.create({
          title: data.title,
        });
      }

      // Return create title
      return feedbackTitle;
    } catch (error) {
      throw error;
    }
  }

  // Get all feedback titles
  static async getAll(): Promise<IFeedbackTitleDoc[]> {
    try {
      const feedbackTitles = await FeedbackTitleModel.find();
      return feedbackTitles;
    } catch (error) {
      throw error;
    }
  }

  // Get all active feedback titles
  static async getAllActiveTitles(): Promise<IFeedbackTitleDoc[]> {
    try {
      const feedbackTitles = await FeedbackTitleModel.find({
        status: "Active",
      });
      return feedbackTitles;
    } catch (error) {
      throw error;
    }
  }

  // Get all major feedback titles
  static async getAllMajorTitles(): Promise<IFeedbackTitleDoc[]> {
    try {
      const feedbackTitles = await FeedbackTitleModel.find({ major: true });
      return feedbackTitles;
    } catch (error) {
      throw error;
    }
  }

  // Find by id
  static async getById(id: string): Promise<IFeedbackTitleDoc | null> {
    try {
      const feedbackTitle = await FeedbackTitleModel.findById(id);
      if (feedbackTitle) return feedbackTitle;

      return null;
    } catch (error) {
      throw error;
    }
  }

  // Find by title
  static async getByTitle(title: string): Promise<IFeedbackTitleDoc | null> {
    try {
      const feedbackTitle = await FeedbackTitleModel.findOne({ title });

      if (feedbackTitle) return feedbackTitle;

      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update title
  static async updateFeedbackTitle(
    id: string,
    data: FeedbackTitleRequest.IUpdateFeedbackTitleInput
  ): Promise<IFeedbackTitleDoc | null> {
    try {
      const feedback = await FeedbackTitleModel.findByIdAndUpdate(
        id,
        { title: data.title },
        { runValidators: true, new: true }
      );
      return feedback;
    } catch (error) {
      throw error;
    }
  }

  // Update status
  static async updateFeedbackTitleStatus(
    id: string,
    data: FeedbackTitleRequest.IUpdateFeedbackStatusInput
  ): Promise<IFeedbackTitleDoc | null> {
    try {
      const feedback = await FeedbackTitleModel.findByIdAndUpdate(
        id,
        { status: data.status },
        { runValidators: true, new: true }
      );
      return feedback;
    } catch (error) {
      throw error;
    }
  }

  // Delete title
  static async deleteFeedbackTitle(id: string) {
    try {
      await FeedbackTitleModel.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete all feedback titles
  static async deleteAllFeedbackTitles() {
    try {
      await FeedbackTitleModel.deleteMany({ $not: { major: true } });
    } catch (error) {
      throw error;
    }
  }
}
