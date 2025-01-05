import APIFeatures from "../../utils/api_features";
import IPurchaseDoc from "./dto";
import PurchaseModel from "./model";

// Purchase Service
export default class Purchase {
  // Create a purchase
  static async createPurchase(
    data: PurchaseRequest.ICreatePurchase
  ): Promise<IPurchaseDoc> {
    try {
      const newPurchase = await PurchaseModel.create(data);
      return newPurchase;
    } catch (error) {
      throw error;
    }
  }

  // Get all purchases
  static async getAllPurchases(query?: RequestQuery): Promise<IPurchaseDoc[]> {
    try {
      const apiFeatures = new APIFeatures(PurchaseModel.find(), query);
      const purchases = await apiFeatures.dbQuery;

      return purchases;
    } catch (error) {
      throw error;
    }
  }

  // Get all purchases for a client
  static async getAllPurchasesClient(data: {
    query?: RequestQuery;
    client_id: string;
  }): Promise<IPurchaseDoc[]> {
    try {
      const apiFeatures = new APIFeatures(
        PurchaseModel.find({ client_id: data.client_id }),
        data.query
      );
      const purchases = await apiFeatures.dbQuery;

      return purchases;
    } catch (error) {
      throw error;
    }
  }

  // Get a single purchase
  static async getPurchase(id: string): Promise<IPurchaseDoc | null> {
    try {
      const purchase = await PurchaseModel.findById(id);
      return purchase;
    } catch (error) {
      throw error;
    }
  }

  // Delete a purchase
  static async deletePurchase(id: string): Promise<IPurchaseDoc | null> {
    try {
      const purchase = await PurchaseModel.findByIdAndDelete(id);
      return purchase;
    } catch (error) {
      throw error;
    }
  }

  // Delete all purchases for a specific client
  static async deletePurchasesClient(client_id: string) {
    try {
      await PurchaseModel.deleteMany({ client_id });
    } catch (error) {
      throw error;
    }
  }

  // Delete all purchases
  static async deleteAllPurchases() {
    try {
      await PurchaseModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }
}
