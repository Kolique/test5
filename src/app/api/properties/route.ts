import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { shortId, slugify } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1).max(200),
  address: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  price: z.string().max(50).optional().nullable(),
  surface: z.string().max(50).optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const data = schema.parse(await req.json())

    const baseSlug = slugify(data.title) || 'bien'
    const slug = `${baseSlug}-${shortId()}`

    const property = await prisma.property.create({
      data: {
        userId: user.id,
        slug,
        title: data.title,
        address: data.address || null,
        description: data.description || null,
        price: data.price || null,
        surface: data.surface || null,
      },
    })

    return NextResponse.json({ id: property.id, slug: property.slug })
  } catch (err: any) {
    if (err?.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    if (err?.issues)
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
