import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: String, default: "" },
    location: { type: String, default: "" },
    specs: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    broker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    brokerName: { type: String, required: true },
    // Trust score between 0 and 100 used to rank listings (higher = more trusted)
    trustScore: { type: Number, min: 0, max: 100, default: 88, index: true },
  },
  { timestamps: true }
);

listingSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Listing = mongoose.model("Listing", listingSchema);
