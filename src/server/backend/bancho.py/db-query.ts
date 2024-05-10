import type { DatabaseUserCompactFields } from './transforms/user'
import { stringToId } from './transforms'

export const userCompactFields = {
  id: true,
  name: true,
  safeName: true,
  country: true,
  priv: true,
} satisfies Record<DatabaseUserCompactFields, true>

export function createUserLikeQuery(keyword: string) {
  const idKw = stringToId(keyword)
  return {
    where: {
      OR: [
        keyword.startsWith('@')
          ? {
              safeName: {
                contains: keyword.slice(1),
              },
            }
          : undefined,
        {
          safeName: {
            contains: keyword,
          },
        },
        {
          name: {
            contains: keyword,
          },
        },
        Number.isNaN(idKw)
          ? undefined
          : {
              id: idKw,
            },
      ].filter(TSFilter),
    },
  }
}
export function createUserHandleWhereQuery(
  {
    handle,
    selectAgainst = ['id', 'name', 'safeName'],
  }: {
    handle: string
    selectAgainst?: Array<'id' | 'name' | 'safeName' | 'email'>
  },
) {
  let handleNum = +handle
  if (Number.isNaN(handleNum)) {
    handleNum = -1
  }

  return {
    OR: [
      includes('safeName', selectAgainst)
        ? {
            safeName: handle.startsWith('@') ? handle.slice(1) : handle,
          }
        : undefined,
      includes('name', selectAgainst)
        ? {
            name: handle,
          }
        : undefined,
      includes('email', selectAgainst)
        ? {
            email: handle,
          }
        : undefined,
      includes('id', selectAgainst)
        ? {
            id: handleNum,
          }
        : undefined,
    ].filter(TSFilter),
  }
}
