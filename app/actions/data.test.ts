import { describe, expect, test } from 'bun:test'
import { sanitizeUserData } from '@/lib/user-sanitizer'
import { UserData } from '@/lib/types'

describe('sanitizeUserData', () => {
  test('removes password field from every user', () => {
    const input: UserData = {
      users: [
        {
          id: 'u1',
          username: 'admin',
          password: 'abcd1234:ef567890',
          isAdmin: true,
        },
        {
          id: 'u2',
          username: 'no-pass',
          isAdmin: false,
        },
      ],
    }

    const output = sanitizeUserData(input)

    expect(output.users).toHaveLength(2)
    expect(output.users[0]).not.toHaveProperty('password')
    expect(output.users[1]).not.toHaveProperty('password')
  })

  test('adds hasPassword metadata based on stored password', () => {
    const input: UserData = {
      users: [
        {
          id: 'u1',
          username: 'with-hash',
          password: 'abcd1234:ef567890',
          isAdmin: false,
        },
        {
          id: 'u2',
          username: 'empty-pass',
          password: '',
          isAdmin: false,
        },
        {
          id: 'u3',
          username: 'no-pass',
          isAdmin: false,
        },
      ],
    }

    const output = sanitizeUserData(input)

    expect(output.users[0].hasPassword).toBe(true)
    expect(output.users[1].hasPassword).toBe(false)
    expect(output.users[2].hasPassword).toBe(false)
  })

  test('preserves other user properties', () => {
    const input: UserData = {
      users: [
        {
          id: 'u1',
          username: 'user',
          password: 'hash',
          avatarPath: '/data/avatars/u1.png',
          isAdmin: false,
          permissions: [
            {
              habit: { write: true, interact: true },
              wishlist: { write: true, interact: true },
              coins: { write: true, interact: true },
            },
          ],
        },
      ],
    }

    const output = sanitizeUserData(input)

    expect(output.users[0].id).toBe('u1')
    expect(output.users[0].username).toBe('user')
    expect(output.users[0].avatarPath).toBe('/data/avatars/u1.png')
    expect(output.users[0].isAdmin).toBe(false)
    expect(output.users[0].permissions?.[0].habit.write).toBe(true)
  })
})
