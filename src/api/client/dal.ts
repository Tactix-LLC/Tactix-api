import ClientModel from "./model";
import IClientDoc from "./dto";

import GameWeekTeamDAL from "../game_week_team/dal";
import GameWeekTeam from "../game_week_team/model";

import APIFeatures from "../../utils/api_features";
import AppError from "../../utils/app_error";
import IGameWeekTeamDoc from "../game_week_team/dto";
import Team from "../team/model";

// Client service
export default class Client {
  // Sign up a client after OTP verification
  static async signUp(data: ClientRequest.ISignup): Promise<IClientDoc> {
    try {
      const clientData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        email: data.email,
        birth_date: data.birth_date,
        pin: data.pin,
        pin_confirm: data.pin_confirm,
        accept: data.accept,
        social_provider: data.social_provider,
        social_id: data.social_id,
        profile_picture: data.profile_picture,
      };
      
      // Generate agent code if not provided
      if (!data.agent_code || data.agent_code.trim() === '' || data.agent_code === 'undefined') {
        try {
          const generateReferralCode = (await import("../../utils/generate_referral_code")).default;
          const timestamp = Date.now().toString().slice(-6);
          const randomCode = generateReferralCode().split('-')[1]; // Get the random part
          clientData.agent_code = `REF-${timestamp}${randomCode.slice(0, 2)}`;
        } catch (error) {
          console.error('Error generating agent code:', error);
          clientData.agent_code = `REF-${Date.now().toString().slice(-6)}`;
        }
      } else {
        clientData.agent_code = data.agent_code;
      }
      
      // Handle ref_agent_code properly
      if (data.ref_agent_code && data.ref_agent_code.trim() !== '' && data.ref_agent_code !== 'undefined') {
        clientData.ref_agent_code = data.ref_agent_code;
      }
      
      const client = await ClientModel.create(clientData);
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Get a client using phone number
  static async getClientByPhonenumber(
    phone_number: string
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findOne({ phone_number });
      if (client) return client;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get a client using email
  static async getClientByEmail(
    email: string
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findOne({ email });
      if (client) return client;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get client by ID
  static async getClientById(id: string): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findById(id);
      if (client) return client;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update client social info
  static async updateClientSocialInfo(
    id: string,
    data: {
      social_provider?: string;
      social_id?: string;
      profile_picture?: string;
    }
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      if (client) return client;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Change client status by id
  static async changeStatus(
    id: string,
    payload: { status: boolean }
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(id, {
        account_status: payload.status,
      });
      if (client) return client;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Change client commission by id
  static async updateCommison(
    id: string,
    payload: {
      commission_balance: number;
      earned_commission: number;
    }
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(id, payload);
      if (client) return client;
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get all Agents
  static async getAllAgents(): Promise<IClientDoc[]> {
    try {
      const clients = await ClientModel.find({ is_agent: true });
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Update client profile
  static async updateClientProfile(
    id: string,
    data: ClientRequest.IUpdateProfile
  ): Promise<IClientDoc | null> {
    try {
      const client = await Client.getClientById(id);
      if (client) {
        client.first_name = data.first_name;
        client.last_name = data.last_name;
        client.birth_date = data.birth_date;
        await client.save();
        return client;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update client
  static async updatePin(
    id: string,
    data: { pin: string; pin_confirm: string }
  ): Promise<IClientDoc | null> {
    try {
      const client = await Client.getClientById(id);
      if (client) {
        client.pin = data.pin;
        client.pin_confirm = data.pin_confirm;
        await client.save();
        return client;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Forgot pin
  static async forgotPin(
    id: string,
    data: { pin_reset_otp: string; pin_reset_otp_count: number }
  ): Promise<IClientDoc | null> {
    try {
      const client = await Client.getClientById(id);
      if (client) {
        client.pin_reset_otp = data.pin_reset_otp;
        client.pin_reset_otp_count = data.pin_reset_otp_count;
        client.is_pin_reset_otp_verified = false;
        client.pin_reset_otp_expires = new Date(Date.now() + 1 * 60 * 1000);
        await client.save();
        return client;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update is pin otp verified
  static async updateIsPinOtpVerified(id: string): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        id,
        { is_pin_reset_otp_verified: true },
        { runValidators: true, new: true }
      );
      if (client) {
        return client;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Reset pin
  static async resetPin(
    id: string,
    data: { pin: string; pin_confirm: string }
  ): Promise<IClientDoc | null> {
    try {
      const client = await Client.getClientById(id);
      if (client) {
        client.pin = data.pin;
        client.pin_confirm = data.pin_confirm;
        client.pin_reset_otp_count = 0;
        client.pin_reset_otp = undefined;
        client.is_pin_reset_otp_verified = false;
        await client.save();
        return client;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Get all clients
  static async getAllClients(query?: RequestQuery): Promise<IClientDoc[]> {
    try {
      const apiFeature = new APIFeatures(ClientModel.find(), query)
        .filter()
        .sort()
        .project()
        .paginate();
      const clients = await apiFeature.dbQuery;
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Get all clients without pagination (for internal processes like auto-join)
  // This method is scalable and will return all clients regardless of count
  static async getAllClientsWithoutPagination(filter?: any): Promise<IClientDoc[]> {
    try {
      const query = filter ? ClientModel.find(filter) : ClientModel.find();
      const clients = await query
        .select("-__v")
        .sort("-createdAt")
        .lean();
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Count all clients
  static async countAllClients(): Promise<number> {
    try {
      const clients = await ClientModel.count();
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Search users for group invitations
  static async searchUsers(query: string, currentUserId: string): Promise<IClientDoc[]> {
    try {
      const users = await ClientModel.find({
        _id: { $ne: currentUserId }, // Exclude current user
        $or: [
          { first_name: { $regex: query, $options: 'i' } },
          { last_name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      })
      .select('first_name last_name email profile_picture')
      .limit(20); // Limit results for performance
      
      return users;
    } catch (error) {
      throw error;
    }
  }

  // Add group to multiple clients
  static async addGroupToClients(clientIds: string[], groupId: string): Promise<void> {
    try {
      await ClientModel.updateMany(
        { _id: { $in: clientIds } },
        { $addToSet: { groups: groupId } }
      );
    } catch (error) {
      throw error;
    }
  }

  // Update profile picture
  static async updateProfilePicture(
    id: string,
    data: { pp_secure_url: string; pp_public_id: string }
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        id,
        {
          pp_secure_url: data.pp_secure_url,
          pp_public_id: data.pp_public_id,
        },
        { runValidators: true, new: true }
      );
      if (client) {
        return client;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Add Agent code
  static async addAgentCode(data: {
    agent_code: string;
    id: string;
  }): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        data.id,
        {
          is_agent: true,
          agent_code: data.agent_code,
        },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Update agent status
  static async updateAgentStatus(
    data: ClientRequest.IUpdateAgentStatus & {
      id: string;
    }
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        data.id,
        {
          is_agent: data.is_agent,
        },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Get client by agent code
  static async getClientByAgentCode(
    agentCode: string
  ): Promise<IClientDoc | null> {
    try {
      const agent = await ClientModel.findOne({ agent_code: agentCode });
      if (agent) {
        return agent;
      }
      return null;
    } catch (err) {
      throw err;
    }
  }

  // Update has_team field. Also give 45 Birr credit
  static async updateHasTeam(
    id: string,
    has_team: boolean
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        id,
        {
          has_team,
          credit: 45,
        },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Set has_team of all clients to false
  static async setAllClientsHasTeamToFalse() {
    try {
      await ClientModel.updateMany({ has_team: false });
    } catch (error) {
      throw error;
    }
  }

  // Update client credit
  static async updateClientCredit(data: {
    amount: number;
    id: string;
  }): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        data.id,
        { credit: data.amount },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Update subscription
  static async updateSubscription(data: {
    id: string;
    subscription_status: string;
    subscription_plan: string;
    subscription_expires_at: Date;
  }): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        data.id,
        {
          subscription_status: data.subscription_status,
          subscription_plan: data.subscription_plan,
          subscription_expires_at: data.subscription_expires_at,
        },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Update Game week package
  static async updateGameweekPackage(data: {
    id: string;
    gameweeks: number;
  }): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        data.id,
        { gameweek_package: data.gameweeks },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Get by agent_code. The client must be an approved agent
  static async getByAgentCode(agent_code: string): Promise<IClientDoc | null> {
    try {
      const agent = await ClientModel.findOne({
        agent_code,
        is_agent: true,
      });
      return agent;
    } catch (error) {
      throw error;
    }
  }


  // Update earned commission of agents
  static async updateEarnedAvailableCommission(data: {
    agent_id: string;
    earnedCommission: number;
    availableCommission: number;
  }): Promise<IClientDoc | null> {
    try {
      const agent = await ClientModel.findByIdAndUpdate(
        data.agent_id,
        {
          earned_commission: data.earnedCommission,
          commission_balance: data.availableCommission,
        },
        { runValidators: true, new: true }
      );
      return agent;
    } catch (error) {
      throw error;
    }
  }

  // Update commission and credit
  static async updateCommissionAndCredit(data: {
    id: string;
    commission_balance: number;
    credit: number;
  }): Promise<IClientDoc | null> {
    try {
      // Update commission and credit
      const client = await ClientModel.findByIdAndUpdate(
        data.id,
        {
          commission_balance: data.commission_balance,
          credit: data.credit,
        },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Update prize and credit
  static async updatePrizeAndCredit(data: {
    id: string;
    prize_balance: number;
    credit: number;
  }): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        data.id,
        {
          prize_balance: data.prize_balance,
          credit: data.credit,
        },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Update prize
  static async updateEarnedPrizeAndPrizeBalance(
    data: ClientRequest.IUpdatePrize
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        data.client_id,
        {
          earned_prize: data.earned_prize,
          prize_balance: data.prize_balance,
        },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Get clients who used the referal code of an agent
  static async getClientsByReferalCode(
    ref_agent_code: string
  ): Promise<IClientDoc[]> {
    try {
      const clients = await ClientModel.find({ ref_agent_code });
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Refund client
  static async refundClient(amount: number, id: string) {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        id,
        { credit: amount },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Delete a client
  static async deleteClient(id: string): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndDelete(id);
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Delete all clients
  static async deleteAllClients() {
    try {
      await ClientModel.deleteMany({});
    } catch (error) {
      throw error;
    }
  }

  // Transfer credit
  static async transferCredit(data: {
    from: IClientDoc;
    to: IClientDoc;
    amount: number;
  }): Promise<{ from: IClientDoc; to: IClientDoc } | null> {
    try {
      const from = await ClientModel.findByIdAndUpdate(
        data.from._id,
        { credit: data.from.credit - data.amount },
        { runValidators: true, new: true }
      );
      if (!from) {
        throw new AppError("There is no client with the specified ID", 404);
      }

      const to = await ClientModel.findByIdAndUpdate(
        data.to._id,
        { credit: data.to.credit + data.amount },
        { runValidators: true, new: true }
      );
      if (!to) {
        throw new AppError("There is no client with the specified ID", 404);
      }

      return { from, to };
    } catch (error) {
      throw error;
    }
  }

  // Buy package using Credit
  static async buyPackageUsingCredit(data: {
    id: string;
    gameweek_package: number;
    credit_amount: number;
  }): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        data.id,
        {
          gameweek_package: data.gameweek_package,
          credit: data.credit_amount,
        },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }

  // Clients without a team
  static async clientsWithoutTeam(): Promise<IClientDoc[]> {
    try {
      const clients = await ClientModel.find({ has_team: false });
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Clients joining game weeks
  static async clientsJoiningGameweeks() {
    try {
      const clients = await GameWeekTeam.aggregate([
        {
          $group: { _id: "$client_id", joined: { $sum: 1 } },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client_id",
            pipeline: [
              {
                $addFields: {
                  full_name: { $concat: ["$first_name", " ", "$last_name"] },
                  id: "$_id",
                },
              },
              {
                $project: { first_name: 1, last_name: 1, full_name: 1, id: 1 },
              },
            ],
          },
        },
        {
          $sort: { joined: -1 },
        },
      ]);
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Agents work rate stat
  static async agentsWorkRateStat(): Promise<IClientDoc[]> {
    try {
      const agents = await ClientModel.find({ is_agent: true })
        .sort("-earned_commission")
        .select(
          "first_name last_name phone_number earned_commission commission_balance agent_code"
        );
      return agents;
    } catch (error) {
      throw error;
    }
  }

  // Most selected favorite coaches
  static async favoriteCoachStat() {
    try {
      const coaches = await Team.aggregate([
        {
          $group: { _id: "$favorite_coach", total_selection: { $sum: 1 } },
        },
        {
          $lookup: {
            from: "coaches",
            localField: "_id",
            foreignField: "_id",
            as: "coach",
            pipeline: [
              {
                $addFields: {
                  coach_name: "$coach_name",
                  id: "$_id",
                },
              },
              {
                $project: { coach_name: 1, id: 1 },
              },
            ],
          },
        },
        {
          $sort: {
            total_selection: -1,
          },
        },
      ]);
      return coaches;
    } catch (error) {
      throw error;
    }
  }

  // Client Age group
  static async clientAgeGroup(): Promise<IClientDoc[]> {
    try {
      const clients = await ClientModel.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$birth_date" },
              age: {
                $subtract: [{ $year: "$$NOW" }, { $year: "$birth_date" }],
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Get non-agent users
  static async getNonAgentUsers(): Promise<IClientDoc[]> {
    try {
      const clients = await ClientModel.find({ is_agent: false });
      return clients;
    } catch (error) {
      throw error;
    }
  }

  // Convert non-agent users
  static async makeUserAnAgent(
    id: string,
    agent_code: string
  ): Promise<IClientDoc | null> {
    try {
      const client = await ClientModel.findByIdAndUpdate(
        id,
        { agent_code, is_agent: true },
        { runValidators: true, new: true }
      );
      return client;
    } catch (error) {
      throw error;
    }
  }
}
