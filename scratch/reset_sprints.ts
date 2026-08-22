import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const result = await prisma.hackathon.updateMany({
    where: {
      joinCode: { not: null }
    },
    data: {
      isStarted: false,
      isPaused: false,
      pausedAt: null,
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
  console.log(`Reset ${result.count} sprints to not started!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
