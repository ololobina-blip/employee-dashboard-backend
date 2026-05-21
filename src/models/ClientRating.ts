import mongoose, { Schema, Document } from 'mongoose'

export interface IClientRating extends Document {
  date: string
  comment: string
  rating: number
  responsible: string
  region?: 'УЗ' | 'РФ' | 'Все'
  syncedAt: Date
}

const ClientRatingSchema = new Schema<IClientRating>(
  {
    date: { type: String, required: true },
    comment: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    responsible: { type: String, required: true, index: true },
    region: { type: String, enum: ['УЗ', 'РФ', 'Все'] },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.model<IClientRating>('ClientRating', ClientRatingSchema)
