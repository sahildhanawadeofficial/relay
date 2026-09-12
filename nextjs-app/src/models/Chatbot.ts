import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWidgetConfig {
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  welcomeMessage: string;
}

export interface IChatbot extends Document {
  _id: mongoose.Types.ObjectId;
  uuid: string;
  name: string;
  userId: mongoose.Types.ObjectId;
  // Public key used to authenticate requests from the embeddable widget
  // (npm package / <script> tag) running on an external website. Distinct
  // from the dashboard's session-based auth used by the owner. Optional in
  // the type because chatbots created before this field existed won't have
  // one until the owner (re)generates it, and documents fetched via
  // `.lean()` don't get schema defaults applied.
  apiKey?: string;
  // Origins allowed to call the public widget API with `apiKey` above.
  // Defaults to ['*'] (any origin) so the widget works out of the box;
  // owners can lock it down to their own domain(s) from the dashboard.
  // Optional for the same `.lean()` / pre-existing-document reason as above.
  allowedOrigins?: string[];
  // Server-side widget appearance/behavior, configurable from the dashboard
  // so the embedded widget doesn't require the customer to hardcode these.
  // Optional for the same `.lean()` / pre-existing-document reason as above.
  widgetConfig?: IWidgetConfig;
  createdAt: Date;
  updatedAt: Date;
}

const WidgetConfigSchema = new Schema<IWidgetConfig>(
  {
    position: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
    primaryColor: { type: String, default: '#4f46e5' },
    welcomeMessage: { type: String, default: 'Hi! How can I help you today?', maxlength: 500 },
  },
  { _id: false }
);

const ChatbotSchema = new Schema<IChatbot>(
  {
    uuid: { type: String, required: true, unique: true },
    name: { type: String, required: true, maxlength: 100 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    apiKey: { type: String, unique: true, sparse: true, index: true },
    allowedOrigins: { type: [String], default: ['*'] },
    widgetConfig: { type: WidgetConfigSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Chatbot: Model<IChatbot> = mongoose.models.Chatbot || mongoose.model<IChatbot>('Chatbot', ChatbotSchema);
