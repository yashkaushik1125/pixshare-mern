import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLE_NAMES } from "../config/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Only the hash is ever stored; the plain password never touches the DB.
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLE_NAMES, default: "viewer" },

    // Profile
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 300 },

    // Social graph
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Hide sensitive/internal fields and expose follow counts (not the raw
// id arrays) from any JSON response.
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.passwordHash;
    ret.followerCount = Array.isArray(ret.followers) ? ret.followers.length : 0;
    ret.followingCount = Array.isArray(ret.following) ? ret.following.length : 0;
    delete ret.followers;
    delete ret.following;
    return ret;
  },
});

userSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model("User", userSchema);
