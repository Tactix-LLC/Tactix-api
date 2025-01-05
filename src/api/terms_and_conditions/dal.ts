import TermsAndConditionsModel from "./model";
import ITermsAndConditionsDoc from "./dto";
import APIFeatures from "../../utils/api_features";

export default class TermsAndConditions {
  // Create
  static async createTerms(
    data: TermsRequest.ICreateTermsInput
  ): Promise<ITermsAndConditionsDoc> {
    try {
      // Create terms and conditions and return it
      const termsAndConditions = await TermsAndConditionsModel.create({
        title: data.title,
        content: data.content,
        is_published: data.is_published,
        is_message: data.is_message,
      });
      return termsAndConditions;
    } catch (error) {
      throw error;
    }
  }

  // Find all terms and conditions
  static async getAllTerms(
    query?: RequestQuery
  ): Promise<ITermsAndConditionsDoc[]> {
    try {
      const apiFeature = new APIFeatures<ITermsAndConditionsDoc>(
        TermsAndConditionsModel.find(),
        query
      ).sort();
      const termsAndConditions = await apiFeature.dbQuery;
      return termsAndConditions;
    } catch (error) {
      throw error;
    }
  }

  // Find is message terms and conditions
  static async getIsMessageTerms(): Promise<ITermsAndConditionsDoc | null> {
    try {
      const termsAndConditionsMessage = await TermsAndConditionsModel.findOne({
        is_message: true,
      });

      return termsAndConditionsMessage;
    } catch (error) {
      throw error;
    }
  }

  // Find all published terms and conditions
  static async getAllPublishedTerms(
    query?: RequestQuery
  ): Promise<ITermsAndConditionsDoc[]> {
    try {
      const apiFeature = new APIFeatures<ITermsAndConditionsDoc>(
        TermsAndConditionsModel.find({ is_published: true }, query)
      );
      const termsAndConditions = await apiFeature.dbQuery;
      return termsAndConditions;
    } catch (error) {
      throw error;
    }
  }

  // Find one by id
  static async getTermById(id: string): Promise<ITermsAndConditionsDoc | null> {
    try {
      // Find terms and conditions
      const terms = await TermsAndConditionsModel.findById(id);
      if (terms) return terms;

      // If not terms and conditions found, return null
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update detail of terms and conditions
  static async updateTerms(
    data: TermsRequest.IUpdateTermsInput & { id: string }
  ): Promise<ITermsAndConditionsDoc | null> {
    try {
      const terms = await TermsAndConditionsModel.findByIdAndUpdate(
        data.id,
        { title: data.title, content: data.content, is_published: data.is_published},
        { runValidators: true, new: true }
      );
      if (terms) return terms;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // update privacy status
  static async updatePublishedStatus(
    data: PrivacyRequest.IUpdatePrivacyByStatusInput & { id: string }
  ): Promise<ITermsAndConditionsDoc | null> {
    try {
      const privacy = await TermsAndConditionsModel.findByIdAndUpdate(
        data.id,
        { is_published: data.status },
        { runValidators: true, new: true }
      );

      if (privacy) {
        return privacy;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  // Delete term by id
  static async deleteTerm(id: string): Promise<ITermsAndConditionsDoc | null> {
    try {
      // Find terms by id delete it. If document exists, return it
      const terms = await TermsAndConditionsModel.findByIdAndDelete(id);
      if (terms) return terms;

      return null; // Return null if there is no document
    } catch (error) {
      throw error;
    }
  }

  // Delete all terms-and-conditions
  static async deleteAllTerms() {
    try {
      await TermsAndConditionsModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }
}
