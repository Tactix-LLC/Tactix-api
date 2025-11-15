import { query } from "express-validator";
import APIFeatures from "../../utils/api_features";
import ICommissionDoc from "./dto";
import Commission from "./model";

// Data access layer for commission
export default class CommissionDAL {
  // Create commission
  static async createCommission(data: {
    client_id: string;
    agent_id: string;
  }): Promise<ICommissionDoc> {
    try {
      const commission = await Commission.create(data);
      return commission;
    } catch (error) {
      throw error;
    }
  }

  // Get comissions of an agent - for both admins and agents
  static async getAgentCommissions(data: {
    agent_id: string;
    query?: RequestQuery;
  }): Promise<ICommissionDoc[]> {
    try {
      const query = data.query;
      const apiFeatures = new APIFeatures<ICommissionDoc>(
        Commission.find({ agent_id: data.agent_id }),
        query
      )
        .sort()
        .paginate();
      const commissions = await apiFeatures.dbQuery;
      return commissions;
    } catch (error) {
      throw error;
    }
  }

  // Get all commissions - for admins only
  static async getAllCommissions(
    query: RequestQuery
  ): Promise<ICommissionDoc[]> {
    try {
      // Find all commissions
      const apiFeatures = new APIFeatures(Commission.find(), query)
        .sort()
        .paginate();
      const commissions = await apiFeatures.dbQuery;
      return commissions;
    } catch (error) {
      throw error;
    }
  }

  // Get get commission by id
  static async getCommissionById(id: string): Promise<ICommissionDoc | null> {
    try {
      const commission = await Commission.findById(id);
      return commission;
    } catch (error) {
      throw error;
    }
  }

  // Get commission by agent ID, and client ID
  static async getCommissionByClientAndAgentID(data: {
    agent_id: string;
    client_id: string;
  }): Promise<ICommissionDoc[]> {
    try {
      const commissions = await Commission.find({
        $and: [{ agent_id: data.agent_id }, { client_id: data.client_id }],
      });
      return commissions;
    } catch (error) {
      throw error;
    }
  }

  // Delete commission by id
  static async deleteCommissionById(
    id: string
  ): Promise<ICommissionDoc | null> {
    try {
      const commission = await Commission.findByIdAndDelete(id);
      return commission;
    } catch (error) {
      throw error;
    }
  }

  // Delete commissions
  static async deleteAllCommissions() {
    try {
      await Commission.deleteMany();
    } catch (error) {
      throw error;
    }
  }
}
