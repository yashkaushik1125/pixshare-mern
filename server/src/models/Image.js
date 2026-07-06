import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "", trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true }, // snapshot for fast rendering
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

imageSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    ret.likes = Array.isArray(ret.likedBy) ? ret.likedBy.length : 0;
    ret.likedBy = (ret.likedBy || []).map((id) => id.toString());
    return ret;
  },
});

export const Image = mongoose.model("Image", imageSchema);
