import { prisma } from '../src/lib/prisma';

async function startSprint() {
  await prisma.hackathon.update({
    where: { joinCode: 'SP-969357' },
    data: { isStarted: true }
  });
  console.log("Sprint started");
}
startSprint();
