import FeedbackModel from "./model";
import IFeedbackDoc from "./dto";
import APIFeatures from "../../utils/api_features";

// Data access layer for feedback data
export default class Feedback {
  // Create feedback
  static async createFeedback(data: {
    title: string;
    content: string;
  }): Promise<IFeedbackDoc> {
    try {
      const feedback = await FeedbackModel.create({
        title: data.title,
        content: data.content,
      });

      // Return
      return feedback;
    } catch (error) {
      throw error;
    }
  }

  // Get all feedbacks
  static async getAll(query?: RequestQuery): Promise<IFeedbackDoc[]> {
    try {
      // Api features
      const apiFeature = new APIFeatures(FeedbackModel.find(), query)
        .filter()
        .project()
        .sort()
        .paginate();
      const feedbacks = await apiFeature.dbQuery;
      return feedbacks;
    } catch (error) {
      throw error;
    }
  }

  // Find by id
  static async getById(id: string): Promise<IFeedbackDoc | null> {
    try {
      const feedback = await FeedbackModel.findById(id);
      if (feedback) return feedback;

      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update first read by and read status
  static async updateReadStatusAndFirstReadBy(data: {
    id: string;
    first_read_by: string;
  }): Promise<IFeedbackDoc | null> {
    try {
      const feedback = await FeedbackModel.findByIdAndUpdate(
        data.id,
        { first_read_by: data.first_read_by, read_status: true },
        { runValidators: true, new: true }
      );
      return feedback;
    } catch (error) {
      throw error;
    }
  }

  // Delete title
  static async deleteFeedback(id: string) {
    try {
      await FeedbackModel.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete all feedbacks
  static async deleteAllFeedbacks() {
    try {
      await FeedbackModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }
}
