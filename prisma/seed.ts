import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed...')

  // Restaurante de exemplo
  const passwordHash = await bcrypt.hash('123456', 12)

  const restaurant = await prisma.restaurant.upsert({
    where: { email: 'admin@burguerhouse.com' },
    update: {},
    create: {
      name: 'Burguer House',
      slug: 'burguer-house',
      email: 'admin@burguerhouse.com',
      passwordHash,
      phone: '11999887766',
      description: 'Os melhores burgers artesanais da cidade!',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      deliveryFee: 5.9,
      deliveryRadius: 10,
      minOrderValue: 25,
      estimatedTime: 40,
      pixKey: '11999887766',
      pixKeyType: 'phone',
      pixMerchantName: 'BURGUER HOUSE',
      openingHours: {
        monday:    { open: '11:00', close: '23:00', enabled: true },
        tuesday:   { open: '11:00', close: '23:00', enabled: true },
        wednesday: { open: '11:00', close: '23:00', enabled: true },
        thursday:  { open: '11:00', close: '23:00', enabled: true },
        friday:    { open: '11:00', close: '00:00', enabled: true },
        saturday:  { open: '11:00', close: '00:00', enabled: true },
        sunday:    { open: '12:00', close: '22:00', enabled: true },
      },
    },
  })

  console.log(`✅ Restaurante: ${restaurant.name} (slug: ${restaurant.slug})`)

  // Categorias
  const [catBurgers, catBebidas, catPorcoes, catSobremesas] = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-burgers' },
      update: {},
      create: { id: 'cat-burgers', name: 'Burgers', icon: '🍔', sortOrder: 1, restaurantId: restaurant.id },
    }),
    prisma.category.upsert({
      where: { id: 'cat-bebidas' },
      update: {},
      create: { id: 'cat-bebidas', name: 'Bebidas', icon: '🥤', sortOrder: 2, restaurantId: restaurant.id },
    }),
    prisma.category.upsert({
      where: { id: 'cat-porcoes' },
      update: {},
      create: { id: 'cat-porcoes', name: 'Porções', icon: '🍟', sortOrder: 3, restaurantId: restaurant.id },
    }),
    prisma.category.upsert({
      where: { id: 'cat-sobremesas' },
      update: {},
      create: { id: 'cat-sobremesas', name: 'Sobremesas', icon: '🍦', sortOrder: 4, restaurantId: restaurant.id },
    }),
  ])

  console.log('✅ Categorias criadas')

  // Menu Items — Burgers
  const classico = await prisma.menuItem.upsert({
    where: { id: 'item-classico' },
    update: {},
    create: {
      id: 'item-classico',
      name: 'Burger Clássico',
      description: 'Blend 180g, queijo cheddar, alface, tomate, cebola e maionese especial no pão brioche',
      price: 29.9,
      images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'],
      featured: true,
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
    },
  })

  const smashburger = await prisma.menuItem.upsert({
    where: { id: 'item-smash' },
    update: {},
    create: {
      id: 'item-smash',
      name: 'Smash Burger Duplo',
      description: 'Dois blends 90g smashados, duplo cheddar, pickles, cebola caramelizada e molho burguer',
      price: 39.9,
      images: ['https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop'],
      featured: true,
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
    },
  })

  const chicken = await prisma.menuItem.upsert({
    where: { id: 'item-chicken' },
    update: {},
    create: {
      id: 'item-chicken',
      name: 'Crispy Chicken',
      description: 'Frango empanado crocante, coleslaw, picles e maionese sriracha no pão de leite',
      price: 34.9,
      images: ['https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop'],
      categoryId: catBurgers.id,
      restaurantId: restaurant.id,
    },
  })

  // Addons para Burgers
  await prisma.addonGroup.upsert({
    where: { id: 'addon-ponto' },
    update: {},
    create: {
      id: 'addon-ponto',
      name: 'Ponto da carne',
      required: true,
      minSelect: 1,
      maxSelect: 1,
      menuItemId: classico.id,
      options: {
        create: [
          { name: 'Mal passado', price: 0 },
          { name: 'Ao ponto', price: 0 },
          { name: 'Bem passado', price: 0 },
        ],
      },
    },
  })

  await prisma.addonGroup.upsert({
    where: { id: 'addon-extras-classico' },
    update: {},
    create: {
      id: 'addon-extras-classico',
      name: 'Extras',
      required: false,
      minSelect: 0,
      maxSelect: 5,
      menuItemId: classico.id,
      options: {
        create: [
          { name: 'Bacon extra', price: 4 },
          { name: 'Ovo frito', price: 3 },
          { name: 'Queijo extra', price: 3 },
          { name: 'Alho poró', price: 2.5 },
        ],
      },
    },
  })

  await prisma.addonGroup.upsert({
    where: { id: 'addon-extras-smash' },
    update: {},
    create: {
      id: 'addon-extras-smash',
      name: 'Extras',
      required: false,
      minSelect: 0,
      maxSelect: 3,
      menuItemId: smashburger.id,
      options: {
        create: [
          { name: 'Bacon crocante', price: 4 },
          { name: 'Cogumelos refogados', price: 5 },
          { name: 'Queijo brie', price: 6 },
        ],
      },
    },
  })

  console.log('✅ Menu items (burgers) e addons criados')

  // Menu Items — Bebidas
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'item-coca',
        name: 'Coca-Cola Lata',
        description: '350ml gelada',
        price: 6,
        images: [],
        categoryId: catBebidas.id,
        restaurantId: restaurant.id,
      },
      {
        id: 'item-suco',
        name: 'Suco Natural',
        description: 'Laranja, limão ou maracujá — 400ml',
        price: 9.9,
        images: [],
        categoryId: catBebidas.id,
        restaurantId: restaurant.id,
      },
      {
        id: 'item-milkshake',
        name: 'Milkshake',
        description: 'Chocolate, morango ou baunilha — 500ml cremoso',
        price: 18.9,
        images: ['https://images.unsplash.com/photo-1572490122747-3e9a61c71e93?w=400&h=300&fit=crop'],
        categoryId: catBebidas.id,
        restaurantId: restaurant.id,
      },
    ],
  })

  // Menu Items — Porções
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'item-fritas',
        name: 'Batata Frita',
        description: 'Porção generosa de batatas fritas crocantes com sal e páprica',
        price: 19.9,
        images: ['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop'],
        categoryId: catPorcoes.id,
        restaurantId: restaurant.id,
      },
      {
        id: 'item-onion',
        name: 'Onion Rings',
        description: 'Anéis de cebola empanados e fritos na hora com molho ranch',
        price: 22.9,
        images: [],
        categoryId: catPorcoes.id,
        restaurantId: restaurant.id,
      },
    ],
  })

  // Menu Items — Sobremesas
  await prisma.menuItem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'item-brownie',
        name: 'Brownie com Sorvete',
        description: 'Brownie quentinho de chocolate belga com sorvete de creme e calda',
        price: 18.9,
        images: [],
        categoryId: catSobremesas.id,
        restaurantId: restaurant.id,
      },
    ],
  })

  console.log('✅ Demais itens do cardápio criados')

  // Cliente de exemplo
  const customerHash = await bcrypt.hash('123456', 12)
  const customer = await prisma.customer.upsert({
    where: { phone: '11988776655' },
    update: {},
    create: {
      name: 'João Silva',
      phone: '11988776655',
      email: 'joao@email.com',
      passwordHash: customerHash,
      addresses: {
        create: {
          label: 'Casa',
          street: 'Rua Exemplo',
          number: '100',
          complement: 'Apto 42',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-000',
          isDefault: true,
        },
      },
    },
  })

  console.log(`✅ Cliente: ${customer.name} (telefone: ${customer.phone})`)

  console.log('\n🎉 Seed concluído!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🍔 RESTAURANTE (painel):')
  console.log('   URL:   http://localhost:3000/login (aba "Sou Restaurante")')
  console.log('   Email: admin@burguerhouse.com')
  console.log('   Senha: 123456')
  console.log('')
  console.log('📱 CARDÁPIO PÚBLICO:')
  console.log('   URL:   http://localhost:3000/burguer-house')
  console.log('')
  console.log('👤 CLIENTE:')
  console.log('   URL:   http://localhost:3000/login (aba "Sou Cliente")')
  console.log('   Fone:  (11) 98877-6655')
  console.log('   Senha: 123456')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
