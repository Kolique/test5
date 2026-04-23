import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const hs = await prisma.hotspot.findUnique({
      where: { id: params.id },
      include: { source: { include: { property: true } } },
    })
    if (!hs || hs.source.property.userId !== user.id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.hotspot.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
