import mongoose from "mongoose";
const { Schema } = mongoose;


const UserSchema = new Schema({
  githubId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: { type: String },
  displayName: { type: String },
  avatarUrl: { type: String },
  email: { type: String },
  
  globalRole: {
    type: String,
    enum: ["super_admin", "user"],
    default: "user"
  },
  
  // Boolean flag for Event Managers
  isEventManager: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

/* =====================================================
   SUB-SCHEMAS (Members, Comments, Replies)
   ===================================================== */

const MemberSubSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    roles: [
      {
        type: String,
        enum: ["admin", "contributor", "collaborator", "viewer"] 
      }
    ],
    invitedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { _id: false }
);

const ReplySubSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const CommentSubSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    replies: [ReplySubSchema],
    attachments: [
      {
        url: { type: String },
        fileType: { type: String }
      }
    ]
  },
  { _id: true }
);

/* =====================================================
   PROJECT SCHEMA
   ===================================================== */
const ProjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  description: { type: String },
  type: {
    type: String,
    enum: ["code", "non-code"],
    required: true
  },
  skillsRequired: [{ type: String }],
  github: {
    repoUrl: { type: String },
    owner: { type: String },
    repo: { type: String },
    lastSyncedAt: { type: Date }
  },
  startDate: { type: Date },
  endDate: { type: Date },
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ["active", "paused", "archived"],
    default: "active"
  },
  members: [MemberSubSchema],
  requests: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [CommentSubSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProjectSchema.pre("save", function () { 
  this.updatedAt = Date.now();
});

ProjectSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

ProjectSchema.methods.isProjectAdmin = function (userId) {
  const member = this.members.find((m) => String(m.userId) === String(userId));
  return !!(member && member.roles.includes("admin"));
};

ProjectSchema.methods.isProjectMember = function (userId) {
  return this.members.some((m) => String(m.userId) === String(userId));
};

/* =====================================================
   EVENT SCHEMA
   ===================================================== */
const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  description: { 
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String // e.g., "10:00 AM" or "48 Hours"
  },
  location: {
    type: String,
    default: "TBD"
  },
  category: {
    type: String, // e.g., "Workshop", "Hackathon", "Seminar"
    required: true
  },
  status: {
    type: String,
    enum: ["upcoming", "completed", "cancelled"],
    default: "upcoming"
  },
  
  // Track who created this specific event instance
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update `updatedAt` for Events
EventSchema.pre("save", function () { 
  this.updatedAt = Date.now();
});
EventSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  this.set({ updatedAt: Date.now() });
  next();
});

/* =====================================================
   EXPORTS
   ===================================================== */
const User = mongoose.model("User", UserSchema);
const Project = mongoose.model("Project", ProjectSchema);
const Event = mongoose.model("Event", EventSchema);

export { User, Project, Event };