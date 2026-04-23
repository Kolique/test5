import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'

const schema = z.object({
  targetRoomId: z.string().min(1),
  pitch: z.number(),
  yaw: z.number(),
  label: z.string().max(60).optional().nullable(),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: { property: true },
    })
    if (!room || room.property.userId !== user.id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = schema.parse(await req.json())
    const target = await prisma.room.findUnique({
      where: { id: data.targetRoomId },
    })
    if (!target || target.propertyId !== room.propertyId)
      return NextResponse.json({ error: 'Pièce cible invalide' }, { status: 400 })

    const hotspot = await prisma.hotspot.create({
      data: {
        sourceRoomId: room.id,
        targetRoomId: data.targetRoomId,
        pitch: data.pitch,
        yaw: data.yaw,
        label: data.label || null,
      },
      include: { target: { select: { id: true, name: true } } },
    })
    return NextResponse.json(hotspot)
  } catch (err: any) {
    if (err?.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
