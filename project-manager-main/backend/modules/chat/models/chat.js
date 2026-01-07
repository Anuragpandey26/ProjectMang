import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    resourceType: {
      type: String,
      required: true,
      enum: ["Project", "Workspace"],
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;