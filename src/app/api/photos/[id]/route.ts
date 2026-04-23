import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { removeUpload } from '@/lib/storage'

export const runtime = 'nodejs'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const photo = await prisma.photo.findUnique({
      where: { id: params.id },
      include: { room: { include: { property: true } } },
    })
    if (!photo || photo.room.property.userId !== user.id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.photo.delete({ where: { id: params.id } })
    await removeUpload(photo.url)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
