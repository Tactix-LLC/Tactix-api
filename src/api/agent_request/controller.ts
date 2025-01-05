import AgentRequest from "./dal";
import AppError from "../../utils/app_error";

import { RequestHandler } from "express";
import IClientDoc from "../client/dto";
import Client from "../client/dal";
import generateAgentCode from "../../utils/generate_agent_code";
import configs from "../../configs";
import send_sms from "./utils/send_sms";

// Create an agent request
export const createAgentRequest: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const reqData = <AgentRequest.ICreateRequest>req.value;

    // Client id
    const user = <IClientDoc>req.user;

    // Check if the user is already an agent
    if (user.is_agent) {
      return next(new AppError("You are already agent.", 400));
    }

    // Check if there is a request
    const agentRequest = await AgentRequest.getAgentRequestByClientId(user._id);
    if (agentRequest) {
      if (
        agentRequest.status === "Pending" ||
        agentRequest.status === "Contacted"
      ) {
        return next(
          new AppError(
            "You already requested to be an agent. Your request status is still under review",
            400
          )
        );
      } else if (agentRequest.status === "Rejected") {
        return next(
          new AppError(
            "You already requested to be an agent. Sorry! You can not work as an agent with us. Thanks for applying",
            400
          )
        );
      }
    }

    // Data
    const data: AgentRequest.ICreateRequest & { client_id: string } = {
      ...reqData,
      client_id: user._id,
    };

    // Create a request
    const newRequest = await AgentRequest.createRequest(data);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message:
        "You have submitted your request successfully. We will contact you ASAP.",
      data: {
        agentRequest: newRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all agent requests
export const getAllAgentRequest: RequestHandler = async (req, res, next) => {
  try {
    const agentRequests = await AgentRequest.getAllAgentRequest(req.query);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: agentRequests.length,
      data: {
        agentRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single agent request
export const getAgentRequest: RequestHandler = async (req, res, next) => {
  try {
    const agentRequest = await AgentRequest.getAgentRequest(req.params.id);
    if (!agentRequest)
      return next(
        new AppError("There is no request with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        agentRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update the status of the request
export const updateAgentRequestStatus: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Get body
    const { status, cancel_reason } = <AgentRequest.IUpdateAgentRequestStatus>(
      req.value
    );

    // Check the agent request exists
    const agentRequest = await AgentRequest.getAgentRequest(req.params.id);
    if (!agentRequest)
      return next(
        new AppError("There is no request with the specified ID", 404)
      );

    // Check client exists
    const client = await Client.getClientById(agentRequest.client_id);
    if (!client) return next(new AppError("Client not found", 404));

    if (
      agentRequest.status === "Approved" ||
      agentRequest.status === "Rejected"
    ) {
      return next(
        new AppError(
          "You can not update a rejected or approved agent request",
          400
        )
      );
    }

    // Data
    let data: AgentRequest.IUpdateAgentRequestStatus & { id: string } = {
      status,
      cancel_reason,
      id: agentRequest._id,
    };

    // Update
    const updatedAgentRequest = await AgentRequest.updateAgentRequestStatus(
      data
    );

    if (updatedAgentRequest) {
      // Check the status and create a notification
      if (status === "Rejected") {
        // Notify the user using notification
      } else if (status === "Approved") {
        // Notify the user using notification

        // Generate Agent code
        let agent_code = "";
        agent_code = generateAgentCode({
          first_name: client.first_name,
          last_name: client.last_name,
        });

        // Update client model
        await Client.addAgentCode({
          agent_code,
          id: agentRequest.client_id,
        });

        // Update Credit
        // New Amount
        const newAmount: number = client.credit + 45;
        await Client.refundClient(newAmount, client._id);

        // Send SMS
        // Message
        const message =
          "ውድ የሎጬ ቤተሰብ ኤጀንት የመሆን ጥያቄዎን ተቀብለን የአንድ ሳምንት መጫወቻ 45ብር ጉርሻ ሰጥተንዎታል፡፡";
        send_sms({ message, phone_number: client.phone_number });
      }
    } else {
      return next(new AppError("Agent request not found", 404));
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Agent request successfully updated",
      data: {
        agentRequest: updatedAgentRequest,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update all pending agent requests
export const updateAllAgentRequests: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    // Get pending requests
    const pendingRequests = await AgentRequest.getAllPendingRequests();

    // Approve
    pendingRequests.forEach(async (agent) => {
      // Get client
      let client = await Client.getClientById(agent.client_id);
      if (client) {
        // Agent code
        let agent_code = generateAgentCode({
          first_name: client.first_name,
          last_name: client.last_name,
        });

        // Approve
        await Client.addAgentCode({
          agent_code,
          id: agent.client_id,
        });

        // Approve the status
        await AgentRequest.updateToApprove(agent.id);

        // Update Credit
        // New Amount
        const newAmount: number = client.credit + 45;
        await Client.refundClient(newAmount, client._id);

        // Send SMS
        // Message
        const message =
          "ውድ የሎጬ ቤተሰብ ኤጀንት የመሆን ጥያቄዎን ተቀብለን የአንድ ሳምንት መጫወቻ 45ብር ጉርሻ ሰጥተንዎታል፡፡";
        send_sms({ message, phone_number: client.phone_number });
      }
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "All agent requests are approved",
    });
  } catch (error) {
    next(error);
  }
};

// Delete an agent request
export const deleteAgentRequest: RequestHandler = async (req, res, next) => {
  try {
    // Delete
    const agentRequest = await AgentRequest.deleteAgentRequest(req.params.id);
    if (!agentRequest)
      return next(
        new AppError("There is no request with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Agent request successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all agent-requests. Note: This method should only be used in dev environment
export const deleteAllRequests: RequestHandler = async (req, res, next) => {
  try {
    // Incoming data
    const data = <AgentRequest.IDeleteAllAgentRequests>req.value;

    // Check delete key
    if (configs.delete_key !== data.delete_key) {
      return next(new AppError("Invalid delete key", 400));
    }

    // Delete all requests
    await AgentRequest.deleteAllRequests();

    // Set is_agent of all clients to false

    // Requests
    res.status(200).json({
      status: "SUCCESS",
      message: "All agent requests deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Cancel agent-request - Will be used only  by client to cancel/delete their request to be an agent
export const cancelRequest: RequestHandler = async (req, res, next) => {
  try {
    // Logged in user data
    const client = <IClientDoc>req.user;

    // Delete request
    const request = await AgentRequest.cancelRequest(client.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "You agent request has been canceled and deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get agent request of client - for clients
export const getClientRequest: RequestHandler = async (req, res, next) => {
  try {
    // Logged in client
    const client = <IClientDoc>req.user;

    // Get request
    const clientRequest = await AgentRequest.getClientRequest(client.id);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      data: { clientRequest },
    });
  } catch (error) {
    next(error);
  }
};

// Get agent requests by status
export const getByStatus: RequestHandler = async (req, res, next) => {
  try {
    // Status
    const status = req.query.status as string;
    if (!status)
      return next(new AppError("Provide an agent request status.", 404));

    const agentRequests = await AgentRequest.getByRequestStatus({
      query: req.query,
      status,
    });

    // Response
    res.status(200).json({
      status: "SUCCESS",
      result: agentRequests.length,
      data: { agentRequests },
    });
  } catch (error) {
    next(error);
  }
};

// Agent request stat
export const agentRequestStat: RequestHandler = async (req, res, next) => {
  try {
    const stat = await AgentRequest.agentRequestStat();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        agentRequestStat: stat,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get agents without agent code
export const getAgentsWithOutAgentCode: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const agents = await AgentRequest.latestApprovedFix();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: agents.length,
      data: {
        agents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get total number of agents
export const totalNumberOfAgents: RequestHandler = async (req, res, next) => {
  try {
    const agents = await AgentRequest.totalNumberOfAgents();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        agents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update credit of all agents
export const updateCreditAgents: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { amount } = <AgentRequest.IUpdateCreditAgents>req.value;

    // Get agents
    const agents = await AgentRequest.getAllAgents();
    agents.forEach(async (agent) => {
      // New Amount
      let newAmount = agent.credit + amount;

      // Update client's credit
      await Client.refundClient(newAmount, agent._id);
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Credit successfully added to agents",
    });
  } catch (error) {
    next(error);
  }
};
