import mongoose, { Schema, Document } from 'mongoose'

export type AppealStatus = 'pending' | 'approved' | 'rejected'

export interface IAppeal extends Document {
  id: string
  ticketLink: string
  employeeName: string
  date: string
  monthYear: string
  comment: string
  status: AppealStatus
  submittedAt: string
  resolvedAt?: string
  resolvedBy?: string
  googleSheetsRowId?: string
  syncedToGoogleSheets: boolean
  createdAt: Date
  updatedAt: Date
}

const AppealSchema = new Schema<IAppeal>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticketLink: { type: String, required: true },
    employeeName: { type: String, required: true, index: true },
    date: { type: String, required: true },
    monthYear: { type: String, required: true },
    comment: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    submittedAt: { type: String, required: true },
    resolvedAt: String,
    resolvedBy: String,
    googleSheetsRowId: String,
    syncedToGoogleSheets: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model<IAppeal>('Appeal', AppealSchema)
