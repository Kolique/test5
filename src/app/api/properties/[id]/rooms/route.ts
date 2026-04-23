import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const schema = z.object({ name: z.string().min(1).max(100) })

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const property = await prisma.property.findUnique({ where: { id: params.id } })
    if (!property || property.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { name } = schema.parse(await req.json())
    const count = await prisma.room.count({ where: { propertyId: params.id } })
    const room = await prisma.room.create({
      data: { propertyId: params.id, name, order: count },
    })
    return NextResponse.json(room)
  } catch (err: any) {
    if (err?.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
