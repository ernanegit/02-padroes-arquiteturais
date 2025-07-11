import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Hash da senha padrão
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Criar usuários
    console.log('👥 Creating users...');
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ecommerce.com' },
      update: {},
      create: {
        email: 'admin@ecommerce.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });

    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        isActive: true,
      },
    });

    console.log(`✅ Created users: ${adminUser.email}, ${customerUser.email}`);

    // 2. Criar produtos
    console.log('📦 Creating products...');

    const products = [
      {
        name: 'Notebook Gamer RTX',
        description: 'Notebook para jogos com placa RTX 4060',
        price: 2999.99,
        sku: 'NBG-RTX-001',
        stock: 50,
        categoryId: 'cat_electronics',
        isActive: true,
      },
      {
        name: 'Mouse Gamer RGB',
        description: 'Mouse óptico com iluminação RGB',
        price: 199.99,
        sku: 'MOU-RGB-002',
        stock: 100,
        categoryId: 'cat_peripherals',
        isActive: true,
      },
    ];

    for (const productData of products) {
      const product = await prisma.product.upsert({
        where: { sku: productData.sku },
        update: {},
        create: productData,
      });
      console.log(`✅ Created product: ${product.name}`);
    }

    console.log('🎉 Database seeding completed!');
    console.log('🔑 Login credentials:');
    console.log('Admin: admin@ecommerce.com / password123');
    console.log('Customer: customer@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });