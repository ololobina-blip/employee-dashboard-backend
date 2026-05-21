import mongoose, { Schema, Document } from 'mongoose'

export interface ITicket extends Document {
  date: string
  monthYear: string
  employeeName: string
  etiquetteComment: string
  solutionComment: string
  speedComment: string
  availabilityComment: string
  participationComment: string
  totalScore: number
  link: string
  callerNumber?: string
  executionLink?: string
  source: 'chat' | 'calls'
  syncedAt: Date
}

const TicketSchema = new Schema<ITicket>(
  {
    date: { type: String, required: true },
    monthYear: { type: String, required: true },
    employeeName: { type: String, required: true, index: true },
    etiquetteComment: { type: String, default: '0 —' },
    solutionComment: { type: String, default: '0 —' },
    speedComment: { type: String, default: '0 —' },
    availabilityComment: { type: String, default: '0 —' },
    participationComment: { type: String, default: '0 —' },
    totalScore: { type: Number, required: true },
    link: { type: String },
    callerNumber: String,
    executionLink: String,
    source: { type: String, enum: ['chat', 'calls'], required: true },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.model<ITicket>('Ticket', TicketSchema)
