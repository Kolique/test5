import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createSession, hashPassword } from '@/lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
  agencyName: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: await hashPassword(data.password),
        name: data.name,
        agencyName: data.agencyName,
      },
    })

    await createSession(user.id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
