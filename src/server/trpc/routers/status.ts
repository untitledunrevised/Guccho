import { router as _router, publicProcedure as p } from '../trpc'
import { ownerProcedure, staffProcedure } from '../middleware/role'
import { MonitorProvider, monitor } from '~/server/singleton/service'

export const router = _router({
  public: p.query(monitor.reportStatus),
  metrics: staffProcedure.query(MonitorProvider.metrics),
  config: ownerProcedure.query(MonitorProvider.config),
})
