import { BanchoPyPrivilege } from '~/server/backend/bancho.py/enums'

const eAll = ExpandedBitwiseEnumArray.fromTSBitwiseEnum(BanchoPyPrivilege)
/** @deprecated use drizzle sql instead! */
export const normal = eAll.and(BanchoPyPrivilege.Normal).and(BanchoPyPrivilege.Verified)
