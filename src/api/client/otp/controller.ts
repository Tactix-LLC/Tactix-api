import { RequestHandler } from "express";
import AppError from "../../../utils/app_error";
import OTP from "./dal";
import Client from "../dal";
import otpGenerator from "../../../utils/otp_generator";
import hashPin from "../../../utils/hash_pin";
import compareOtp from "../../../utils/compare_otp";
import generateToken from "../../../utils/generate_token";
import configs from "../../../configs";
import axios from "axios";
import nodemailer from "nodemailer";

export const sendOtp: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const data = <OTPRequest.ISendOtp>req.value;

    // Check there's agent with the provided agent_code
    if (data.ref_agent_code) {
      const agent = await Client.getByAgentCode(data.ref_agent_code);
      if (!agent) return next(new AppError("Invalid agent selected", 400));
    }

    // Check if there is a client
    const clientEmail = await Client.getClienyByEmail(data.email);
    if (clientEmail)
      return next(
        new AppError("You already have an account. Please login", 400)
      );

    // Check the agent if there is an agent code
    if (data.agent_code) {
      const agent = await Client.getClientByAgentCode(data.agent_code);
      if (!agent)
        return next(
          new AppError(
            "There is no agent code with the specified agent code",
            404
          )
        );
    }

    // Check if pin and pin confirm are similar
    if (data.pin !== data.pin_confirm) {
      return next(new AppError("Pin and Pin confirm should be similar", 401));
    }

    // Check age
    const currentYear = new Date(Date.now()).getFullYear();
    const clientBirthYear = new Date(data.birth_date).getFullYear();
    const age = currentYear - clientBirthYear;
    if (age < 18) return next(new AppError("Under age", 403));

    // Otp count
    let otp_count: number = 1;

    // Updated at
    let updated_at: Date = new Date(Date.now());

    // Created at
    let created_at: Date = new Date(Date.now());

    // Get existing OTP
    const prevOtp = await OTP.getOtp(data.email);
    if (prevOtp) {
      // Set created at
      created_at = new Date(prevOtp.created_at);

      // Check the number of otps requested
      if (parseInt(prevOtp.otp_count) >= 5) {
        // Updated at
        const otp_updated_at = new Date(prevOtp.updated_at);
        if (Date.now() < otp_updated_at.getTime() + 60 * 60 * 1000) {
          return next(
            new AppError(
              "You have requested multiple OTPs. Try again after an hour",
              400
            )
          );
        } else {
          otp_count = 1;
        }
      } else {
        // OTP count
        otp_count = parseInt(prevOtp.otp_count) + 1;
      }
    }

    // Generate OTP
    const { otp, hashedOtp } = otpGenerator();

    // Hash pin and pin confirm
    const { pin, pin_confirm } = hashPin(data.pin);

    // Add to redis
    await OTP.createOtp({
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number,
      email: data.email,
      birth_date: new Date(data.birth_date),
      pin,
      pin_confirm,
      accept: data.accept,
      agent_code: data.agent_code,
      ref_agent_code: data.ref_agent_code,
      otp: hashedOtp,
      otp_count,
      created_at,
      updated_at,
    });

    // Check the env and send Email
    if (configs.env === "development") {
      // Send Email
      const transporter = nodemailer.createTransport({
        host: configs.email.host,
        port: configs.email.port,
        secure: configs.email.secure,
        auth: {
          user: configs.email.auth.user,
          pass: configs.email.auth.pass,
        },
      });

      const mailOptions = {
        from: configs.email.auth.user,
        to: data.email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({
        status: "SUCCESS",
        message: "A verification code is sent to your email.",
        otp,
      });

    } else {
      // Send Email
      const transporter = nodemailer.createTransport({
        host: configs.email.host,
        port: configs.email.port,
        secure: configs.email.secure,
        auth: {
          user: configs.email.auth.user,
          pass: configs.email.auth.pass,
        },
      });

      const mailOptions = {
        from: configs.email.auth.user,
        to: data.email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({
        status: "SUCCESS",
        message: "A verification code is sent to your email.",
      });
    }
  } catch (error) {
    next(error);
  }
};

// Verify OTP
export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    // Get body
    const { otp, email } = <OTPRequest.IVerifyOtp>req.value;

    // Get the otp
    const prevOtp = await OTP.getOtp(email);
    if (!prevOtp)
      return next(
        new AppError(
          "There is no OTP created with the specified email.",
          400
        )
      );

    // Compare expire date
    const updated_at = new Date(prevOtp.updated_at);
    if (updated_at.getTime() + 1 * 60 * 1000 < Date.now())
      return next(new AppError("OTP has expired", 400));

    // Compare hashed OTP
    if (!compareOtp(otp, prevOtp.otp))
      return next(new AppError("Invalid OTP", 400));

    // Move the data to Persitance DB
    const clientData: ClientRequest.ISignup = {
      first_name:
        prevOtp.first_name[0].toUpperCase() + prevOtp.first_name.slice(1),
      last_name:
        prevOtp.last_name[0].toUpperCase() + prevOtp.last_name.slice(1),
      phone_number: prevOtp.phone_number,
      email: prevOtp.email,
      birth_date: new Date(prevOtp.birth_date),
      pin: prevOtp.pin,
      pin_confirm: prevOtp.pin_confirm,
      accept: Boolean(prevOtp.accept),
      agent_code: prevOtp.agent_code,
      ref_agent_code: prevOtp.ref_agent_code,
    };
    const client = await Client.signUp(clientData);

    // Generate Token
    const token = generateToken({ id: client._id, user: "client" });

    // Delete the otp from Redis
    await OTP.deleteOtp(email);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      message: "You have created your account successfully",
      data: {
        client,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};
