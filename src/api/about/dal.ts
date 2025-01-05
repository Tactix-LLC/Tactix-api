import AboutUsModel from "./model";
import IAboutUsDoc from "./dto";

// Data access layer for about-us data
export default class AboutUs {
  // Create about-us content
  static async createAboutUs(
    data: AboutUsRequest.IAboutUsInput
  ): Promise<IAboutUsDoc> {
    try {
      const aboutUs = await AboutUsModel.create({
        content: data.content,
        version_title: data.version_title,
        version_content: data.version_content,
      });

      // Return create content
      return aboutUs;
    } catch (error) {
      throw error;
    }
  }
  // Get all about-us content
  static async getEveryAboutUs(): Promise<IAboutUsDoc[]> {
    try {
      const aboutUs = await AboutUsModel.find();
      return aboutUs;
    } catch (error) {
      throw error;
    }
  }
  // Get all about-us content
  static async getAll(): Promise<IAboutUsDoc[]> {
    try {
      const aboutUs = await AboutUsModel.find({ is_active: true });
      return aboutUs;
    } catch (error) {
      throw error;
    }
  }

  // Find by id
  static async getById(id: string): Promise<IAboutUsDoc | null> {
    try {
      const aboutUs = await AboutUsModel.findById(id);
      if (aboutUs) return aboutUs;

      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update content
  static async updateContent(
    id: string,
    data: AboutUsRequest.IUpdateAboutUsInput
  ): Promise<IAboutUsDoc | null> {
    try {
      const aboutUs = await AboutUsModel.findByIdAndUpdate(
        id,
        {
          content: data.content,
          version_title: data.version_title,
          version_content: data.version_content,
        },
        { runValidators: true, new: true }
      );

      return aboutUs;
    } catch (error) {
      throw error;
    }
  }

  // Update status
  static async updateStatus(
    id: string,
    data: AboutUsRequest.IUpdateAboutUsStatusInput
  ): Promise<IAboutUsDoc | null> {
    try {
      const aboutUs = await AboutUsModel.findByIdAndUpdate(
        id,
        { is_active: data.is_active },
        { runValidators: true, new: true }
      );
      return aboutUs;
    } catch (error) {
      throw error;
    }
  }

  // Delete content
  static async deleteAboutUs(id: string) {
    try {
      await AboutUsModel.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
}
