import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        rooms: {
          orderBy: { order: 'asc' },
          include: {
            photos: { orderBy: { order: 'asc' } },
            hotspots: { include: { target: true } },
          },
        },
      },
    })
    if (!property || property.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(property)
  } catch (err: any) {
    if (err?.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property || property.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.property.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
