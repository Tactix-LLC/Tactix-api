import mongoose, { Schema, model } from "mongoose";
import IClientDoc from "./dto";

import bcrypt from "bcryptjs";

// Client schema
const clientSchema = new Schema(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      maxlength: [100, "First name can not exceed 100 characters"],
      minlength: [1, "First name can not be less than 1 character"],
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      maxlength: [100, "Last name can not exceed 100 characters"],
      minlength: [1, "Last name can not be less than 1 character"],
    },
    phone_number: {
      type: String,
      required: false,
      maxlength: [20, "Phone number can not exceed 20 characters"],
      unique: true,
      sparse: true, // Allows multiple null values for unique field
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      maxlength: [100, "Email cannot exceed 100 characters"],
      minlength: [5, "Email cannot be less than 5 characters"],
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    birth_date: {
      type: Date,
      required: false,
    },
    role: {
      type: String,
      default: "Client",
      enum: {
        values: ["Client"],
        message: "Unknown or Invalid client role",
      },
    },
    pin: {
      type: String,
      required: [true, "Pin is required"],
    },
    pin_confirm: {
      type: String,
      required: [true, "Pin confirm is required"],
      validate: {
        validator: function (this: IClientDoc, value: string) {
          return this.pin === value;
        },
        message: "Pin and pin confirm should be the same",
      },
    },
    accept: {
      type: Boolean,
      required: [
        true,
        "Accepting our terms & conditions and privacy pollicy is required",
      ],
    },
    pin_reset_otp: String,
    pin_reset_otp_count: {
      type: Number,
      min: [0, "Pin reset otp count can not be less than 0"],
      default: 0,
    },
    pin_reset_otp_expires: Date,
    is_pin_reset_otp_verified: {
      type: Boolean,
      default: false,
    },
    pin_changed_at: Date,
    phone_number_changed_at: Date,
    credit: {
      type: Number,
      min: [0, "Credit can not be less than 0"],
      default: 0,
    },
    pp_public_id: String,
    pp_secure_url: String,
    account_status: {
      type: Boolean,
      default: true,
    },
    is_agent: {
      type: Boolean,
      default: false,
    },
    agent_code: String,
    ref_agent_code: String,
    commission_balance: {
      type: Number,
      default: 0,
      min: [0, "Commission balance must be greater than zero"],
    },
    earned_commission: {
      type: Number,
      default: 0,
      min: [0, "Earned commission must be greater than zero"],
    },
    earned_prize: {
      type: Number,
      default: 0,
      min: [0, "Earned prize must be greater than zero"],
    },
    prize_balance: {
      type: Number,
      default: 0,
      min: [0, "Prize balance must be greater than zero"],
    },
    has_team: {
      type: Boolean,
      default: false,
    },
    gameweek_package: {
      type: Number,
      default: 0,
      min: [0, "Number of gameweek package can not be less than 0"],
    },
    social_provider: {
      type: String,
      enum: ["google", "facebook", "apple"],
      required: false,
    },
    social_id: {
      type: String,
      required: false,
    },
    profile_picture: {
      type: String,
      required: false,
    },
    groups: [{
      type: mongoose.Types.ObjectId,
      ref: "Group",
    }],
  },
  {
    writeConcern: {
      w: "majority",
      j: true,
    },
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Full name
clientSchema.virtual("full_name").get(function (this: IClientDoc) {
  return `${this.first_name} ${this.last_name}`;
});

// Add Pin changed at
clientSchema.pre("save", function (this: IClientDoc, next) {
  if (!this.isModified("pin") || this.isNew) return next();
  this.pin_changed_at = new Date(Date.now());
  next();
});

// Compare pin
clientSchema.methods.comparePin = function (
  this: IClientDoc,
  candidatePin: string,
  pin: string
): boolean {
  return bcrypt.compareSync(candidatePin, pin);
};

// Phone number changed at
clientSchema.methods.checkPhonenumberChangedAt = function (
  this: IClientDoc,
  iat: number
): boolean {
  if (this.phone_number_changed_at) {
    return iat < Math.round(this.phone_number_changed_at.getTime() / 1000);
  }
  return false;
};

// Pin changed at
clientSchema.methods.checkPinChangedAt = function (
  this: IClientDoc,
  iat: number
) {
  if (this.pin_changed_at) {
    return iat < Math.round(this.pin_changed_at.getTime() / 1000);
  }
  return false;
};

// Client model
const Client = model<IClientDoc>("Client", clientSchema);

export default Client;
