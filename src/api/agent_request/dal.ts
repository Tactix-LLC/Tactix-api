import IAgentRequestDoc from "./dto";
import AgentRequestModel from "./model";
import APIFeatures from "../../utils/api_features";
import Client from "../client/model";
import IClientDoc from "../client/dto";

// Agent Request Service
export default class AgentRequest {
  // Create a request
  static async createRequest(
    data: AgentRequest.ICreateRequest & { client_id: string }
  ): Promise<IAgentRequestDoc> {
    try {
      const newRequest = await AgentRequestModel.create({
        client_id: data.client_id,
        facebook_link: data.facebook_link,
        tiktok_link: data.tiktok_link,
        instagram_link: data.instagram_link,
        current_job: data.current_job,
        user_traction: data.user_traction,
      });
      return newRequest;
    } catch (error) {
      throw error;
    }
  }

  // Get all agent requests
  static async getAllAgentRequest(
    query?: RequestQuery
  ): Promise<IAgentRequestDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IAgentRequestDoc>(
        AgentRequestModel.find().populate({
          path: "client_id",
          select: "first_name last_name",
        }),
        query
      )
        .filter()
        .sort()
        .project()
        .paginate();
      const agentRequests = await apiFeatures.dbQuery;

      return agentRequests;
    } catch (error) {
      throw error;
    }
  }

  // Get a single agent request
  static async getAgentRequest(id: string): Promise<IAgentRequestDoc | null> {
    try {
      const agentRequest = await AgentRequestModel.findById(id).populate({
        path: "client_id",
        select: "first_name last_name phone_number",
      });

      return agentRequest;
    } catch (error) {
      throw error;
    }
  }

  // Get an agent requesy by user id
  static async getAgentRequestByClientId(
    client_id: string
  ): Promise<IAgentRequestDoc | null> {
    try {
      const agentRequest = await AgentRequestModel.findOne({ client_id });
      return agentRequest;
    } catch (error) {
      throw error;
    }
  }

  // Get total number of our agents
  static async totalNumberOfAgents(): Promise<number> {
    try {
      const agents = await Client.find({ is_agent: true }).count();
      return agents;
    } catch (error) {
      throw error;
    }
  }

  // Get agents
  static async getAllAgents(): Promise<IClientDoc[]> {
    try {
      const clients = await Client.find({ is_agent: true });
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Update the status of an agent request
  static async updateAgentRequestStatus(
    data: AgentRequest.IUpdateAgentRequestStatus & { id: string }
  ): Promise<IAgentRequestDoc | null> {
    try {
      const agentRequest = await AgentRequestModel.findByIdAndUpdate(
        data.id,
        { status: data.status, cancel_reason: data.cancel_reason },
        { runValidators: true, new: true }
      );
      return agentRequest;
    } catch (error) {
      throw error;
    }
  }

  // Get all pending requests
  static async getAllPendingRequests(): Promise<IAgentRequestDoc[]> {
    try {
      const agents = await AgentRequestModel.find({ status: "Pending" });
      return agents;
    } catch (error) {
      throw error;
    }
  }

  // Update to approve for all pending requests
  static async updateToApprove(id: string): Promise<IAgentRequestDoc | null> {
    try {
      const agent = await AgentRequestModel.findByIdAndUpdate(
        id,
        { status: "Approved" },
        { runValidators: true, new: true }
      );
      return agent;
    } catch (error) {
      throw error;
    }
  }

  // Delete an agent request
  static async deleteAgentRequest(id: string) {
    try {
      const agentRequest = await AgentRequestModel.findByIdAndDelete(id);
      return agentRequest;
    } catch (error) {
      throw error;
    }
  }

  // Delete all agent-requests
  static async deleteAllRequests() {
    try {
      await AgentRequestModel.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Cancel request
  static async cancelRequest(
    client_id: string
  ): Promise<IAgentRequestDoc | null> {
    try {
      const agentRequest = await AgentRequestModel.findOneAndDelete({
        client_id,
      });
      return agentRequest;
    } catch (error) {
      throw error;
    }
  }

  // Get agent request of a client
  static async getClientRequest(
    client_id: string
  ): Promise<IAgentRequestDoc | null> {
    try {
      const clientRequest = await AgentRequestModel.findOne({ client_id });
      return clientRequest;
    } catch (error) {
      throw error;
    }
  }

  // Get all requests by status - for admin side
  static async getByRequestStatus(data: {
    query?: RequestQuery;
    status: string;
  }): Promise<IAgentRequestDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IAgentRequestDoc>(
        AgentRequestModel.find({ status: data.status }),
        data.query
      )
        .filter()
        .sort()
        .project()
        .paginate();
      const agentRequests = await apiFeatures.dbQuery;
      return agentRequests;
    } catch (error) {
      throw error;
    }
  }

  // Agent request stat
  static async agentRequestStat(): Promise<IAgentRequestDoc[]> {
    try {
      const stat = await AgentRequestModel.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
          },
        },
      ]);
      return stat;
    } catch (error) {
      throw error;
    }
  }

  // Latest update
  static async latestApprovedFix(): Promise<IAgentRequestDoc[]> {
    try {
      const agents = await AgentRequestModel.find({
        updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      });
      return agents;
    } catch (error) {
      throw error;
    }
  }
}
