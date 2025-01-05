import FaqModel from "./model";
import IFaqDoc from "./dto";

// Faq service
export default class Faq {
  // Create an Faq
  static async createFaq(data: FaqRequest.ICreateFaqInput): Promise<IFaqDoc> {
    try {
      // Create an Faq
      const newFaq: IFaqDoc = await FaqModel.create({
        title: data.title,
        content: data.content,
      });

      return newFaq;
    } catch (error) {
      throw error;
    }
  }

  // Get all Faqs
  static async getFaqs(): Promise<IFaqDoc[]> {
    try {
      const faqs = await FaqModel.find({ is_published: true });
      return faqs;
    } catch (error) {
      throw error;
    }
  }

  // Get all Faqs
  static async getEveryFaq(): Promise<IFaqDoc[]> {
    try {
      const faqs = await FaqModel.find();
      return faqs;
    } catch (error) {
      throw error;
    }
  }

  //get FAQ by id
  static async getFaqById(id: string): Promise<IFaqDoc | null> {
    try {
      const faq = await FaqModel.findById(id);
      if (faq) {
        return faq;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // update FAQ status
  static async updatePublishedStatus(
    data: FaqRequest.IUpdateFaqByStatusInput & { id: string }
  ): Promise<IFaqDoc | null> {
    try {
      const faq = await FaqModel.findByIdAndUpdate(
        data.id,
        { is_published: data.status },
        { runValidators: true, new: true }
      );

      if (faq) {
        return faq;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // update FAQ
  static async updateFaq(
    data: FaqRequest.IUpdateFaqInput & { id: string }
  ): Promise<IFaqDoc | null> {
    try {
      const faq = await FaqModel.findByIdAndUpdate(
        data.id,
        { title: data.title, content: data.content },
        { runValidators: true, new: true }
      );

      if (faq) {
        return faq;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // delete single FAQ
  static async deleteSingleFaq(id: string): Promise<IFaqDoc | null> {
    try {
      const faq = await FaqModel.findByIdAndDelete(id);
      if (faq) {
        return faq;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // delete all FAQs
  static async deleteFaqs(): Promise<void> {
    try {
      await FaqModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }
}
