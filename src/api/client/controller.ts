import axios from "axios";
import { RequestHandler } from "express";
import { generatePasswordResetEmailTemplate } from "../../utils/email_templates";
import { sendEmail } from "../../utils/sendgrid_email";

import GameWeekDAL from "../game_week/dal";

import Client from "./dal";
import AppError from "../../utils/app_error";

import generateToken from "../../utils/generate_token";
import hashPin from "../../utils/hash_pin";
import otpGenerator from "../../utils/otp_generator";
import compareOtp from "../../utils/compare_otp";
import IClientDoc from "./dto";
import configs from "../../configs";
import IAdminDoc from "../admin/dto";
import Transaction from "../transaction/dal";
import Winners from "../winners/dal";
import GameWeekTeamDAL from "../game_week_team/dal";
import generate_agent_code from "../../utils/generate_agent_code";
import nodemailer from "nodemailer";

export const clientLogin: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const data = <ClientRequest.ILogin>req.value;

    // Get client and check pin
    const client = await Client.getClientByEmail(data.email);
    if (!client || !client.comparePin(data.pin, client.pin))
      return next(new AppError("Invalid email or password", 400));

    // Generate token
    const token = generateToken({ id: client._id, user: "client" });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "You have logged in successfully",
      data: {
        client,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Update Profile
export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const data = <ClientRequest.IUpdateProfile>req.value;

    // Get client
    const getClient = <IClientDoc>req.user;

    // Age validation removed - app now supports all ages
    // if (data.birth_date) {
    //   const currentYear = new Date(Date.now()).getFullYear();
    //   const clientBirthYear = new Date(data.birth_date).getFullYear();
    //   const age = currentYear - clientBirthYear;
    //   if (age < 18) return next(new AppError("Under age", 403));
    // }

    const client = await Client.updateClientProfile(getClient.id, data);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "You have updated your profile successfully",
      data: {
        client,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update pin
export const updatePin: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const data = <ClientRequest.IUpdatePin>req.value;

    // Check if pin and pin confirm are similar
    if (data.pin !== data.pin_confirm) {
      return next(new AppError("Pin and Pin confirm should be similar", 401));
    }

    // Get the client
    const client = <IClientDoc>req.user;

    // Check the pin
    if (!client.comparePin(data.current_pin, client.pin))
      return next(new AppError("Invalid current pin", 400));

    // Hash the pin
    const { pin, pin_confirm } = hashPin(data.pin);

    // Update
    await Client.updatePin(client._id, { pin, pin_confirm });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "You have updated your pin successfully. Please login.",
      data: {
        client,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Forgot pin
export const forgotPin: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { email } = <ClientRequest.IForgotPin>req.value;

    // Check if there is a client with the specified email
    const client = await Client.getClientByEmail(email);
    if (!client)
      return next(
        new AppError("There is no client with the specified email", 404)
      );

    // Check the pin reset otp count
    let pin_reset_otp_count = client.pin_reset_otp_count;
    if (pin_reset_otp_count >= 5) {
      const updatedAt = new Date(client.updatedAt);
      if (Date.now() < updatedAt.getTime() + 24 * 60 * 60 * 1000) {
        return next(
          new AppError(
            "You have requested multiple OTPs. Try again after an hour",
            400
          )
        );
      } else {
        pin_reset_otp_count = 1;
      }
    } else {
      pin_reset_otp_count += 1;
    }

    // Generate a reset otp
    const { otp, hashedOtp } = otpGenerator();

    // Update the document
    const updatedClient = await Client.forgotPin(client._id, {
      pin_reset_otp: hashedOtp,
      pin_reset_otp_count,
    });

    // Check the env and send Email
    if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid HTTP API (works better on cloud platforms)
      await sendEmail({
        to: email,
        subject: "Reset Your Password - Tactix Football Fantasy",
        html: generatePasswordResetEmailTemplate(otp, client.first_name),
        text: `Your password reset OTP is ${otp}`,
      });

      res.status(200).json({
        status: "SUCCESS",
        message: "A verification code is sent to your email.",
        ...(configs.env === "development" && { otp }),
      });
    } else {
      // Fallback to SMTP (for local development)
      const transporter = nodemailer.createTransport(configs.email as any);

      const mailOptions = {
        from: configs.email.from,
        to: email,
        subject: "Reset Your Password - Tactix Football Fantasy",
        html: generatePasswordResetEmailTemplate(otp, client.first_name),
        text: `Your password reset OTP is ${otp}`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({
        status: "SUCCESS",
        message: "A verification code is sent to your email.",
        ...(configs.env === "development" && { otp }),
      });
    }
  } catch (error) {
    next(error);
  }
};

// Verify reset pin otp
export const verifyResetOtp: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const data = <ClientRequest.IVerifyResetOtp>req.value;

    // Get client
    const client = await Client.getClientByEmail(data.email);
    if (!client)
      return next(
        new AppError("There is no client with the specified email", 404)
      );

    // Check if there is a forgot pin process started
    if (!client.pin_reset_otp)
      return next(
        new AppError(
          "There is no forgot pin process started using this email",
          400
        )
      );

    // Compare the OTP
    if (!compareOtp(data.otp, client.pin_reset_otp))
      return next(new AppError("Invalid OTP", 400));

    // Check the expire date of the otp
    if (Date.now() >= new Date(client.pin_reset_otp_expires).getTime())
      return next(new AppError("OTP Expired", 400));

    // Update the status
    await Client.updateIsPinOtpVerified(client._id);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "OTP is successfully verified. Please reset your pin.",
      data: {
        client,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reset pin
export const resetPin: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const data = <ClientRequest.IResetPin>req.value;

    // Get client
    const client = await Client.getClientByEmail(data.email);
    if (!client)
      return next(
        new AppError("There is no client with the specified email", 404)
      );

    // Check if there is a forgot pin process started
    if (!client.pin_reset_otp)
      return next(
        new AppError(
          "There is no forgot pin process started using this email",
          400
        )
      );

    // Check if pin and pin confirm are similar
    if (data.pin !== data.pin_confirm) {
      return next(new AppError("Pin and Pin confirm should be similar", 401));
    }

    // Check if the OTP is verified
    if (!client.is_pin_reset_otp_verified)
      return next(new AppError("OTP is not verified", 400));

    // Hash
    const { pin, pin_confirm } = hashPin(data.pin);

    // Update
    const updatedClient = await Client.resetPin(client._id, {
      pin,
      pin_confirm,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "You have successfully resetted your pin. Please login",
      data: {
        client: updatedClient,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single client
export const getClient: RequestHandler = async (req, res, next) => {
  try {
    const client = await Client.getClientById(req.params.id);
    if (!client)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        client,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a client by phone number
export const getClientByPhoneNumber: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const client = await Client.getClientByPhonenumber(req.params.phone_number);
    if (!client)
      return next(
        new AppError("There is no client with the specified phone number", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        client,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a profile
export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const getClient = <IClientDoc>req.user;
    const client = await Client.getClientById(getClient._id);
    if (!client)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        client,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all clients
export const getAllClients: RequestHandler = async (req, res, next) => {
  try {
    const clients = await Client.getAllClients(req.query);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: clients.length,
      data: {
        clients,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Count all clients
export const countAllClients: RequestHandler = async (req, res, next) => {
  try {
    const allClients = await Client.countAllClients();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      allClients,
    });
  } catch (error) {
    next(error);
  }
};

// Update Profile picture
export const updateProfilePicture: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const data = <ClientRequest.IProfilePicture>req.value;

    // Get the client
    const user = <IClientDoc>req.user;
    const client = await Client.getClientById(user._id);
    if (!client)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    // Update
    const updatedClient = await Client.updateProfilePicture(user._id, {
      pp_secure_url: data.pp_secure_url,
      pp_public_id: data.pp_public_id,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Profile picture is updated successfully",
      data: {
        client: updatedClient,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update agent status
export const updateAgentStatus: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { is_agent } = <ClientRequest.IUpdateAgentStatus>req.value;

    // Check client
    const client = await Client.getClientById(req.params.id);
    if (!client)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    // Data
    const data: ClientRequest.IUpdateAgentStatus & { id: string } = {
      is_agent,
      id: client._id,
    };

    // Update
    const agent = await Client.updateAgentStatus(data);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Agent status is successfully updated",
      data: { agent },
    });
  } catch (error) {
    next(error);
  }
};

// Check Agent Code
export const checkAgentCode: RequestHandler = async (req, res, next) => {
  try {
    // Get agent code
    const agentCode = req.params.agentcode;

    // Check if agent code exists
    if (!agentCode) return next(new AppError("Agent code is required", 400));

    // Get agent
    const agent = await Client.getClientByAgentCode(agentCode);
    if (!agent)
      return res.status(200).json({
        status: "SUCCESS",
        data: {
          is_agent: false,
        },
      });

    // Check if is agent is true
    if (!agent.is_agent)
      return res.status(200).json({
        status: "SUCCESS",
        data: {
          is_agent: false,
        },
      });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        is_agent: agent.is_agent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get clients who used refral code and agent
export const getByAgentCode: RequestHandler = async (req, res, next) => {
  try {
    const agentCode = req.query.agentcode as string;
    const clients = await Client.getClientsByReferalCode(agentCode);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: clients.length,
      data: { clients },
    });
  } catch (error) {
    next(error);
  }
};

// Refund client
export const refundClient: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { amount } = <ClientRequest.IRefundCredit>req.value;

    // Get the client
    const client = await Client.getClientById(req.params.id);
    if (!client)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    // Set the amount
    const newAmount = client.credit + amount;

    // Update
    await Client.refundClient(newAmount, client._id);

    // Transaction History
    await Transaction.createTransaction({
      transactionType: "Deposit",
      amount,
      client_id: client._id,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Credit refunded successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update gameweek package
export const updateGameweekPackage: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { gameweeks } = <ClientRequest.IRefundPackage>req.value;

    // Get client
    const client = await Client.getClientById(req.params.id);
    if (!client)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    // Latest game week package
    const latestGameweekPackage = client.gameweek_package + gameweeks;

    // Refund
    await Client.updateGameweekPackage({
      id: req.params.id,
      gameweeks: latestGameweekPackage,
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Package successfully refunded",
    });
  } catch (error) {
    next(error);
  }
};

// Buy Package using Credit
export const buyPackageUsingCredit: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { amount, gameweeks } = <ClientRequest.IBuyPackageCredit>req.value;

    // Get user
    const user = <IClientDoc>req.user;

    // Check credit
    if (user.credit < amount)
      return next(new AppError("Insufficient credit amount", 400));

    // Latest credit amount
    const latestCreditAmount = user.credit - amount;

    // Latest Game week package
    const latestGameweekPackage = user.gameweek_package + gameweeks;

    // Update
    const client = await Client.buyPackageUsingCredit({
      id: user.id,
      gameweek_package: latestGameweekPackage,
      credit_amount: latestCreditAmount,
    });

    // Transaction
    if (client) {
      // Transaction History
      await Transaction.createTransaction({
        transactionType: "Package",
        amount,
        client_id: client._id,
        gameweek_package: gameweeks,
      });
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "You have successfully purchased a package using your credit",
    });
  } catch (error) {
    next(error);
  }
};

// Delete own account (self-deletion for clients)
export const deleteOwnAccount: RequestHandler = async (req, res, next) => {
  try {
    const user = <IClientDoc>req.user;
    const clientId = user._id.toString();

    // Delete the client
    const client = await Client.deleteClient(clientId);
    if (!client)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Your account has been successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Delete a client (admin only)
export const deleteClient: RequestHandler = async (req, res, next) => {
  try {
    const client = await Client.deleteClient(req.params.id);
    if (!client)
      return next(
        new AppError("There is no client with the specified ID", 404)
      );

    const user = <IAdminDoc>req.user;
    if (!user.first_account)
      return next(
        new AppError(
          "Only an admin with first account can delete the clients",
          400
        )
      );

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Client is successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Delete all clients
export const deleteAllClients: RequestHandler = async (req, res, next) => {
  try {
    const { delete_key } = <ClientRequest.IDeleteAllClients>req.value;

    if (delete_key !== configs.delete_key)
      return next(new AppError("Invalid delete key", 400));

    const user = <IAdminDoc>req.user;
    if (!user.first_account)
      return next(
        new AppError(
          "Only an admin with first account can delete the clients",
          400
        )
      );

    await Client.deleteAllClients();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "All clients are successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

// Update prize_balance
export const updatePrizeBalance: RequestHandler = async (req, res, next) => {
  try {
    const data = <ClientRequest.IUpdatePrize>req.value;

    // Find client
    const clientInDB = await Client.getClientById(data.client_id);
    if (!clientInDB) return next(new AppError("Client does not exist", 404));

    // Update prize_balance and earned_prize
    data.prize_balance = data.prize_balance
      ? clientInDB.prize_balance + data.prize_balance
      : clientInDB.prize_balance;
    data.earned_prize = data.earned_prize
      ? clientInDB.earned_prize + data.earned_prize
      : clientInDB.earned_prize;

    // Check the updated value of earned_prize is not less than zero
    if (data.earned_prize < 0) {
      return next(
        new AppError(
          `You cannot deduct more than ${clientInDB.earned_prize} from client's earned balance`,
          400
        )
      );
    }

    // Check the updated value of prize_balance is not less than zero
    if (data.prize_balance < 0) {
      return next(
        new AppError(
          `You cannot deduct more than ${clientInDB.prize_balance} from client's prize balance`,
          400
        )
      );
    }

    // Update client prize
    const client = await Client.updateEarnedPrizeAndPrizeBalance(data);

    // Response
    res.status(200).json({
      status: "SUCCESS",
      message: "Client earned prize and prize balance updated successfully",
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};

// Clients without a team
export const clientsWithoutTeam: RequestHandler = async (req, res, next) => {
  try {
    const clients = await Client.clientsWithoutTeam();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: clients.length,
    });
  } catch (error) {
    next(error);
  }
};

// Clients joining game weeks
export const clientsJoiningGameweeks: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const clients = await Client.clientsJoiningGameweeks();

    // Get the number of game weeks created
    const gameWeeks = await GameWeekDAL.gameWeeksCreated();

    // Count active, medium, and passive clients
    const count = { active: 0, medium: 0, passive: 0 };

    // Categorize clients as active or passive
    clients.forEach((client) => {
      // Percentile
      let percentile: number = (client.joined / gameWeeks) * 100;

      if (percentile >= 75 && percentile <= 100) {
        client.status = "Active";
        count.active += 1;
      } else if (percentile >= 50 && percentile < 75) {
        client.status = "Medium";
        count.medium += 1;
      } else {
        client.status = "Passive";
        count.passive += 1;
      }
    });

    // Send notification for Passive and Medium Users to join more gameweeks

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Agent work rate
export const agentsWorkRate: RequestHandler = async (req, res, next) => {
  try {
    const agents = await Client.agentsWorkRateStat();

    // Total sum of commission made
    let totalCommissions = 0;
    agents.forEach((agent) => {
      totalCommissions += agent.earned_commission;
    });

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: agents.length,
      data: {
        totalCommissions,
        agents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Favorite coach stat
export const favoriteCoachStat: RequestHandler = async (req, res, next) => {
  try {
    const coaches = await Client.favoriteCoachStat();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        coaches,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Client age group
export const clientAgeGroup: RequestHandler = async (req, res, next) => {
  try {
    const clients = await Client.clientAgeGroup();

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      results: clients.length,
      data: {
        clients,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Change Client Status
export const changeClientStatus: RequestHandler = async (req, res, next) => {
  try {
    const status = req.body;

    const client = await Client.changeStatus(req.params.id, status);
    if (!client) {
      return next(new AppError("Client does not exists", 404));
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Client status changed successfuly!",
    });
  } catch (error) {
    next(error);
  }
};

// Change Client commision
export const changeCommision: RequestHandler = async (req, res, next) => {
  try {
    const commision = req.body;

    const client = await Client.updateCommison(req.params.id, commision);
    if (!client) {
      return next(new AppError("Client does not exists", 404));
    }

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "Client commison updated successfuly!",
    });
  } catch (error) {
    next(error);
  }
};

// Get all non-agent users
export const getNonAgetUsers: RequestHandler = async (req, res, next) => {
  try {
    const nonAgentUsers = await Client.getNonAgentUsers();

    // Response
    res.status(200).json({
      status: "SUCCESS",
      results: nonAgentUsers.length,
      data: { nonAgentUsers },
    });
  } catch (error) {
    next(error);
  }
};

// Make all non-agent users become agent
export const makeUsersAgent: RequestHandler = async (req, res, next) => {
  try {
    // Get all non-agent users
    const nonAgentUsers = await Client.getNonAgentUsers();

    const batchSize = 20;
    const totalUsers = nonAgentUsers.length;
    const totalIterations = Math.ceil(totalUsers / batchSize);

    for (let i = 0; i < totalIterations; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, totalUsers);
      const batchUsers = nonAgentUsers.slice(startIdx, endIdx);

      const agentData = batchUsers.map((user) => ({
        first_name: user.first_name,
        last_name: user.last_name,
      }));

      const agentCodes = agentData.map((data) => generate_agent_code(data));

      // Convert users to agents
      batchUsers.map(async (user, idx) => {
        const agentCode = agentCodes[idx];
        await Client.makeUserAnAgent(user.id, agentCode);
      });
    }

    // Send response after all users are processed
    res.status(200).json({
      status: "SUCCESS",
      message: "All non-agent users converted to an agent",
    });
  } catch (error) {
    next(error);
  }
};
