import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清除現有資料
  await prisma.schedule.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();

  // 建立管理員帳號
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: 'admin123',
      name: '管理員',
      role: 'ADMIN',
    },
  });

  // 建立客戶帳號
  const customer = await prisma.user.create({
    data: {
      email: 'user@test.com',
      password: 'user123',
      name: '測試客戶',
      role: 'CUSTOMER',
    },
  });

  console.log('✓ 資料庫已初始化');
  console.log('管理員:', admin);
  console.log('客戶:', customer);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
