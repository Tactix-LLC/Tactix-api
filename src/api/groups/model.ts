import mongoose, { Schema } from "mongoose";
import IGroupDoc from "./dto";

// Groups schema
const groupsSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      minlength: [2, "Group name must have at least 2 characters"],
      maxlength: [50, "Group name cannot exceed 50 characters"],
      trim: true,
    },
    name_slug: {
      type: String,
      required: false, // Will be generated in pre-save
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
      trim: true,
    },
    max_members: {
      type: Number,
      default: 50,
      min: [2, "Maximum members must be at least 2"],
      max: [100, "Maximum members cannot exceed 100"],
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: [true, "Group owner is required"],
    },
    code: {
      type: String,
      required: false, // Will be generated in pre-save
      unique: true,
      uppercase: true,
      length: [6, "Group code must be exactly 6 characters"],
    },
    members: [{
      type: mongoose.Types.ObjectId,
      ref: "Client",
    }],
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "archived"],
        message: "Status must be active, inactive, or archived",
      },
      default: "active",
    },
    competition: {
      type: mongoose.Types.ObjectId,
      ref: "Competition",
      required: false,
    },
    is_public: {
      type: Boolean,
      default: true,
    },
    join_code: {
      type: String,
      required: false, // Will be generated in pre-save
      unique: true,
      uppercase: true,
      length: [8, "Join code must be exactly 8 characters"],
    },
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

// Indexes
groupsSchema.index({ name_slug: 1 });
groupsSchema.index({ code: 1 });
groupsSchema.index({ join_code: 1 });
groupsSchema.index({ owner: 1 });
groupsSchema.index({ members: 1 });
groupsSchema.index({ status: 1 });

// Virtual for member count
groupsSchema.virtual('member_count').get(function() {
  return this.members.length;
});

// Pre-save middleware to generate codes and slug
groupsSchema.pre('save', async function(next) {
  // Generate unique 6-character code if not present
  if (!this.code) {
    let code: string;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (await Groups.findOne({ code }));
    this.code = code;
  }

  // Generate unique 8-character join code if not present
  if (!this.join_code) {
    let joinCode: string;
    do {
      joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    } while (await Groups.findOne({ join_code: joinCode }));
    this.join_code = joinCode;
  }

  // Generate name slug if not present or if name changed
  if (!this.name_slug || this.isModified('name')) {
    this.name_slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Groups model
const Groups = mongoose.model<IGroupDoc>("Group", groupsSchema);

// Export model
export default Groups;
