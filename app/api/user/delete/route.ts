import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteUser } from '@/app/actions/data'
import { getCurrentUser } from '@/lib/server-helpers'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      // This case should ideally not happen if session.user.id exists,
      // but as a safeguard:
      return NextResponse.json({ error: 'Unauthorized: User not found in system' }, { status: 401 })
    }

    let userIdToDelete: string
    try {
      const body = await req.json()
      userIdToDelete = body.userId
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body: Could not parse JSON.' }, { status: 400 })
    }
    

    if (!userIdToDelete) {
      return NextResponse.json({ error: 'Bad Request: userId is required' }, { status: 400 })
    }

    // Security Check: Users can only delete their own account unless they are an admin.
    if (!currentUser.isAdmin && userIdToDelete !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this user.' }, { status: 403 })
    }

    await deleteUser(userIdToDelete)

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting user:', error)
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
