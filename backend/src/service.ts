// In routes/users.ts or routes/chat.ts (wherever appropriate)
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/first-service', async (req, res) => {
  const serviceUser = await prisma.user.findFirst({
    where: { role: 'service' },
    select: { id: true, name: true }
  });

  if (!serviceUser) {
   res.status(404).json({ message: 'No service user found' });
    return ;
  }

  res.json(serviceUser);
});

export default router;
