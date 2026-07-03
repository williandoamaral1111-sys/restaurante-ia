'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

// ─── Schemas de validação ───────────────────────────────────────────

const RestaurantLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha muito curta'),
})

const RestaurantRegisterSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  phone: z.string().optional(),
})

const CustomerLoginSchema = z.object({
  phone: z.string().min(10, 'Telefone inválido'),
  password: z.string().min(6, 'Senha muito curta'),
})

const CustomerRegisterSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export type FormState = {
  errors?: Record<string, string[]>
  message?: string
} | undefined

// ─── Login do Restaurante ───────────────────────────────────────────

export async function loginRestaurant(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = RestaurantLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { email, password } = validatedFields.data

  const restaurant = await prisma.restaurant.findUnique({ where: { email } })

  if (!restaurant || !await bcrypt.compare(password, restaurant.passwordHash)) {
    return { message: 'Email ou senha incorretos' }
  }

  if (!restaurant.active) {
    return { message: 'Restaurante desativado. Entre em contato com o suporte.' }
  }

  await createSession({ id: restaurant.id, email: restaurant.email, role: 'restaurant' })
  redirect('/dashboard')
}

// ─── Cadastro do Restaurante ────────────────────────────────────────

export async function registerRestaurant(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = RestaurantRegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { name, email, password, phone } = validatedFields.data

  const exists = await prisma.restaurant.findUnique({ where: { email } })
  if (exists) {
    return { errors: { email: ['Este email já está cadastrado'] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const slug = generateSlug(name)

  const uniqueSlug = await ensureUniqueSlug(slug)

  const restaurant = await prisma.restaurant.create({
    data: { name, email, passwordHash, phone, slug: uniqueSlug },
  })

  await createSession({ id: restaurant.id, email: restaurant.email, role: 'restaurant' })
  redirect('/dashboard')
}

// ─── Login do Cliente ───────────────────────────────────────────────

export async function loginCustomer(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = CustomerLoginSchema.safeParse({
    phone: formData.get('phone'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { phone, password } = validatedFields.data
  const cleanPhone = phone.replace(/\D/g, '')

  const customer = await prisma.customer.findUnique({ where: { phone: cleanPhone } })

  if (!customer || !await bcrypt.compare(password, customer.passwordHash)) {
    return { message: 'Telefone ou senha incorretos' }
  }

  await createSession({ id: customer.id, email: customer.phone, role: 'customer' })

  const redirectTo = formData.get('redirect') as string || '/'
  redirect(redirectTo)
}

// ─── Cadastro do Cliente ────────────────────────────────────────────

export async function registerCustomer(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = CustomerRegisterSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email') || undefined,
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { name, phone, email, password } = validatedFields.data
  const cleanPhone = phone.replace(/\D/g, '')

  const phoneExists = await prisma.customer.findUnique({ where: { phone: cleanPhone } })
  if (phoneExists) {
    return { errors: { phone: ['Este número já está cadastrado'] } }
  }

  if (email) {
    const emailExists = await prisma.customer.findUnique({ where: { email } })
    if (emailExists) {
      return { errors: { email: ['Este email já está cadastrado'] } }
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const customer = await prisma.customer.create({
    data: { name, phone: cleanPhone, email: email || null, passwordHash },
  })

  await createSession({ id: customer.id, email: customer.phone, role: 'customer' })

  const redirectTo = formData.get('redirect') as string || '/'
  redirect(redirectTo)
}

// ─── Logout ─────────────────────────────────────────────────────────

export async function logout() {
  await deleteSession()
  redirect('/login')
}

// ─── Helper ─────────────────────────────────────────────────────────

async function ensureUniqueSlug(slug: string): Promise<string> {
  let candidate = slug
  let counter = 1
  while (true) {
    const exists = await prisma.restaurant.findUnique({ where: { slug: candidate } })
    if (!exists) return candidate
    candidate = `${slug}-${counter++}`
  }
}
