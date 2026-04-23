import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

async function assertOwner(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { property: true },
  })
  if (!room || room.property.userId !== userId) return null
  return room
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const room = await assertOwner(params.id, user.id)
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.room.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
