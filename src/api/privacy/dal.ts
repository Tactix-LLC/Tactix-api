import PrivacyModel from "./model";
import IPrivacyDoc from "./dto";
import APIFeatures from "../../utils/api_features";

// Privacy service
export default class Privacy {
  // Create an Privacy
  static async createPrivacy(
    data: PrivacyRequest.ICreatePrivacyInput
  ): Promise<IPrivacyDoc> {
    try {
      // Create an Privacy
      const newPrivacy: IPrivacyDoc = await PrivacyModel.create(data);

      return newPrivacy;
    } catch (error) {
      throw error;
    }
  }

  // Get all Privacies
  static async getPrivacies(query?: RequestQuery): Promise<IPrivacyDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IPrivacyDoc>(
        PrivacyModel.find({ is_published: true }),
        query
      )
        .filter()
        .project()
        .sort();
      const privacies = await apiFeatures.dbQuery;
      return privacies;
    } catch (error) {
      throw error;
    }
  }

  // Get all Privacies
  static async getAllPrivacies(query?: RequestQuery): Promise<IPrivacyDoc[]> {
    try {
      const apiFeature = new APIFeatures<IPrivacyDoc>(
        PrivacyModel.find(),
        query
      )
        .filter()
        .project()
        .sort();

      const privacies = await apiFeature.dbQuery;
      return privacies;
    } catch (error) {
      throw error;
    }
  }

  // filter privacies
  static async filterPrivaciesByIsMessage(): Promise<IPrivacyDoc | null> {
    try {
      const privacy = await PrivacyModel.findOne({ is_message: true });
      if (privacy) return privacy;
      return null;
    } catch (error) {
      throw error;
    }
  }

  //get privacy by id
  static async getPrivacyById(id: string): Promise<IPrivacyDoc | null> {
    try {
      const privacy = await PrivacyModel.findById(id);
      if (privacy) {
        return privacy;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // update privacy status
  static async updatePublishedStatus(
    data: PrivacyRequest.IUpdatePrivacyByStatusInput & { id: string }
  ): Promise<IPrivacyDoc | null> {
    try {
      const privacy = await PrivacyModel.findByIdAndUpdate(
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

  // update privacy
  static async updatePrivacy(
    data: PrivacyRequest.IUpdatePrivacyInput & { id: string }
  ): Promise<IPrivacyDoc | null> {
    try {
      const privacy = await PrivacyModel.findByIdAndUpdate(
        data.id,
        { title: data.title, content: data.content },
        { runValidators: true, new: true }
      );
      if (privacy) return privacy;

      return null;
    } catch (error) {
      throw error;
    }
  }

  // delete single privacy
  static async deleteSinglePrivacy(id: string): Promise<IPrivacyDoc | null> {
    try {
      const privacy = await PrivacyModel.findByIdAndDelete(id);
      if (privacy) return privacy;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // delete all Privaciess
  static async deletePrivacies(): Promise<void> {
    try {
      await PrivacyModel.deleteMany();
    } catch (error) {
      throw error;
    }
  }
}
