import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

(async () => {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: 'teste@example.com' }
    });

    if (!existing) {
      const user = await prisma.user.create({
        data: {
          id: 'user-test-001',
          name: 'Usuário Teste',
          email: 'teste@example.com',
          passwordHash: await bcrypt.hash('123456', 10),
        },
      });
      console.log('✓ Usuário criado:', user.email, 'com senha: 123456');
    } else {
      console.log('✓ Usuário já existe:', existing.email);
    }
  } catch (e) {
    console.error('Erro:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
