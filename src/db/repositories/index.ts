export { EmployeeRepository, type Employee } from './EmployeeRepository'
export { TicketRepository, type Ticket } from './TicketRepository'
export { SyncLogRepository, type SyncLog } from './SyncLogRepository'
export { AppealRepository, type Appeal } from './AppealRepository'

import EmployeeRepository from './EmployeeRepository'
import TicketRepository from './TicketRepository'
import SyncLogRepository from './SyncLogRepository'
import AppealRepository from './AppealRepository'

export default {
  employees: EmployeeRepository,
  tickets: TicketRepository,
  syncLogs: SyncLogRepository,
  appeals: AppealRepository,
}
