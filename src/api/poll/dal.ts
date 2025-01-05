import Pol from "./model";
import IPolDoc from "./dto";
import IPollResponseDoc from "../poll_response/dto";
import APIFeatures from "../../utils/api_features";
import PollResponse from "../poll_response/model";

// Data access layer for
export default class PollDAL {
  // Create poll
  static async createPol(data: PollRequests.ICreateInput): Promise<IPolDoc> {
    try {
      const poll = await Pol.create(data);
      return poll;
    } catch (error) {
      throw error;
    }
  }

  // Get all polls
  static async getAll(query?: RequestQuery): Promise<IPolDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IPolDoc>(Pol.find(), query)
        .filter()
        .paginate()
        .sort()
        .project();

      const polls = await apiFeatures.dbQuery;
      return polls;
    } catch (error) {
      throw error;
    }
  }

  // Get poll by id
  static async getById(id: string): Promise<IPolDoc | null> {
    try {
      const poll = await Pol.findById(id);
      return poll;
    } catch (error) {
      throw error;
    }
  }

  // Update poll info
  static async updatePollInfo(
    id: string,
    data: PollRequests.IUpdateInput
  ): Promise<IPolDoc | null> {
    try {
      const poll = await Pol.findByIdAndUpdate(id, data, {
        runValidators: true,
        new: true,
      });
      return poll;
    } catch (error) {
      throw error;
    }
  }

  // Update poll status
  static async updateStatus(
    id: string,
    status: string
  ): Promise<IPolDoc | null> {
    try {
      const poll = await Pol.findByIdAndUpdate(
        id,
        { status },
        { runValidators: true, new: true }
      );
      return poll;
    } catch (error) {
      throw error;
    }
  }

  // Delete all polls in DB
  static async deleteAll() {
    try {
      await Pol.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Delete poll by id
  static async deleteById(id: string): Promise<IPolDoc | null> {
    try {
      const poll = await Pol.findByIdAndDelete(id);
      return poll;
    } catch (error) {
      throw error;
    }
  }

  // Find poll response by user and poll
  static async getByPollAndUser(
    user_id: string,
    poll_id: string
  ): Promise<IPollResponseDoc | null> {
    try {
      const pollResponse = await PollResponse.findOne({
        $and: [{ user_id }, { poll_id }],
      }).populate({ path: "poll_id" });
      return pollResponse;
    } catch (error) {
      throw error;
    }
  }

  // Create poll response - when a user selects an answer
  static async createPollResponse(
    data: PollResRequests.ICreateInput
  ): Promise<IPollResponseDoc> {
    try {
      const pollResponse = await PollResponse.create(data);
      return pollResponse;
    } catch (error) {
      throw error;
    }
  }

  // Get polls a client has participated in
  static async getUserPolls(
    user_id: string,
    query?: RequestQuery
  ): Promise<IPollResponseDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IPollResponseDoc>(
        PollResponse.find({ user_id }).populate({
          path: "poll_id",
        }),
        query
      );

      const userPols = await apiFeatures.dbQuery;
      return userPols;
    } catch (error) {
      throw error;
    }
  }

  // Delete poll responses that are linked to a poll
  static async deleteResponsesOfPoll(poll_id: string) {
    try {
      await PollResponse.deleteMany({ poll_id });
    } catch (error) {
      throw error;
    }
  }

  // Delete all poll responses in DB
  static async deleteAllPollResponses() {
    try {
      await PollResponse.deleteMany();
    } catch (error) {
      throw error;
    }
  }

  // Get all poll responses
  static async getAllPollResponses(
    query?: RequestQuery
  ): Promise<IPollResponseDoc[]> {
    try {
      const apiFeatures = new APIFeatures<IPollResponseDoc>(
        PollResponse.find(),
        query
      )
        .paginate()
        .filter()
        .sort()
        .project();

      const pollResponses = await apiFeatures.dbQuery;
      return pollResponses;
    } catch (error) {
      throw error;
    }
  }
}
