import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IChatbot extends Document {
  _id: mongoose.Types.ObjectId;
  uuid: string;
  name: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotSchema = new Schema<IChatbot>(
  {
    uuid: { type: String, required: true, unique: true },
    name: { type: String, required: true, maxlength: 100 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const Chatbot: Model<IChatbot> = mongoose.models.Chatbot || mongoose.model<IChatbot>('Chatbot', ChatbotSchema);
