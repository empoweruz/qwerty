import { PrismaClient } from '@prisma/client'

try {
  const client = new PrismaClient();
  console.log("Prisma client instantiated successfully");
} catch (e: any) {
  console.error("Failed to instantiate", e.message);
}
