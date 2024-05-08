import { aliasedTable, and, eq, notExists } from 'drizzle-orm'
import { type DatabaseUserCompactFields, dedupeUserRelationship, fromBanchoPyRelationType, idToString, stringToId, toBanchoPyRelationType, toUserCompact } from '../transforms'

// import { idToString, stringToId } from '../transforms'
import type { Id } from '..'
import * as schema from '../drizzle/schema'
import { config as _config } from '../env'
import { useDrizzle } from './source/drizzle'
import { prismaClient } from './source/prisma'
import type { UserCompact } from '~/def/user'
import { Relationship } from '~/def'
import type { UserRelationProvider as Base } from '$base/server'

const config = _config()

export class UserRelationProvider implements Base<Id> {
  static readonly stringToId = stringToId
  static readonly idToString = idToString

  prisma = prismaClient
  drizzle = useDrizzle(schema)
  config = config

  async getOne(fromUser: { id: Id }, toUser: { id: Id }) {
    const relationship = await this.drizzle.query.relationships.findFirst({
      where: and(
        eq(schema.relationships.fromUserId, fromUser.id),
        eq(schema.relationships.toUserId, toUser.id)
      ),
      columns: {
        type: true,
      },
    })

    if (!relationship) {
      return undefined
    }

    switch (relationship.type) {
      case 'friend': return Relationship.Friend
      case 'block': return Relationship.Blocked
      default: assertNotReachable(relationship.type)
    }
  }

  async get({ user }: { user: { id: Id } }) {
    const pRelationResult = this.drizzle.query.relationships.findMany({
      where: eq(schema.relationships.fromUserId, user.id),
      columns: {
        type: true,
        toUserId: true,
      },
      with: {
        toUser: true,
      },
    })

    const pGotRelationResult = this.drizzle.query.relationships.findMany({
      where: eq(schema.relationships.toUserId, user.id),
      columns: {
        type: true,
        fromUserId: true,
      },
    })

    const [relationships, gotRelationships] = await Promise.all([
      pRelationResult.then(r => r.map(_r => ({ ..._r, type: fromBanchoPyRelationType(_r.type) }))),
      pGotRelationResult.then(r => r.map(_r => ({ ..._r, type: fromBanchoPyRelationType(_r.type) }))),
    ])

    const transformed = relationships.map(r => ({
      ...r,
      toUser: toUserCompact(r.toUser, this.config),
    }))
    const deduped = dedupeUserRelationship(transformed)

    for (const _user of deduped) {
      const reverse = gotRelationships
        .filter(reverse => reverse.fromUserId === _user.id)
        .map(rev => rev.type)
      _user.relationshipFromTarget = reverse
      _user.mutualRelationship = calculateMutualRelationships(
        _user.relationship,
        _user.relationshipFromTarget,
      )
    }

    return deduped
  }

  async notMutual(user: { id: Id }) {
    // rel toUserId = u.id and exists (fromUser = u.id, toUser = toUserId)
    const _u = aliasedTable(schema.users, 'pickUsers')
    const _rel = aliasedTable(schema.relationships, 'r')
    const _got = aliasedTable(schema.relationships, 'got')

    const res = await this.drizzle
      .select(pick(_u, ['country', 'id', 'name', 'priv', 'safeName'] satisfies DatabaseUserCompactFields[]))
      .from(_u)
      .innerJoin(_rel, eq(_rel.fromUserId, _u.id))
      .where(
        and(
          eq(_rel.type, 'friend'),
          eq(_rel.toUserId, user.id),

          notExists(this.drizzle.select().from(_got).where(and(eq(_got.fromUserId, user.id), eq(_got.toUserId, _rel.fromUserId))))
        )
      )

    return res.map(r => toUserCompact(r, this.config))
  }

  async removeOne({
    fromUser,
    targetUser,
    type,
  }: {
    fromUser: UserCompact<Id>
    targetUser: UserCompact<Id>
    type: Relationship
  }) {
    // bancho.py only allows one relationshipType per direction per one user pair
    // so cannot delete with where condition due to prisma not allowing it.
    // So to make sure that we are removing right relationship, we have to compare
    // relation type against input before remove it.
    const relationship = await this.getOne(fromUser, targetUser)

    if (relationship !== type) {
      throw new Error('not-found')
    }

    await this.prisma.relationship.delete({
      where: {
        fromUserId_toUserId: {
          fromUserId: fromUser.id,
          toUserId: targetUser.id,
        },
      },
    })
  }

  async createOneRelationship({
    fromUser,
    targetUser,
    type,
  }: {
    fromUser: UserCompact<Id>
    targetUser: UserCompact<Id>
    type: Relationship
  }) {
    if (fromUser.id === targetUser.id) {
      throw new Error('disallow-add-self')
    }
    // bancho.py only allows one relationshipType per direction per one user pair
    // so cannot delete with where condition due to prisma not allowing it.
    // So to make sure that we are removing right relationship, we have to compare
    // relation type against input before remove it.
    const relationship = await this.getOne(fromUser, targetUser)

    if (relationship) {
      throw new Error('has-relationship')
    }

    await this.prisma.relationship.create({
      data: {
        fromUserId: fromUser.id,
        toUserId: targetUser.id,
        type: toBanchoPyRelationType(type),
      },
    })
  }

  async count({ user, type }: { user: UserCompact<Id>; type: Relationship }) {
    return await this.prisma.relationship.count({
      where: {
        toUserId: user.id,
        type: toBanchoPyRelationType(type),
      },
    })
  }
}
