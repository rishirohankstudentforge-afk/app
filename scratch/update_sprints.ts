import { prisma } from "../src/lib/prisma";

async function main() {
  const h = await prisma.hackathon.findFirst({ where: { title: "HakITxMRDU" } });
  if (!h) {
    console.log("Hackathon HakITxMRDU not found!");
    return;
  }
  console.log("Found hackathon ID:", h.id);
  
  const sprints = await prisma.hackathon.findMany({ where: { type: "Sprint" } });
  
  for (const s of sprints) {
    let duration = 0;
    if (s.title.includes("Easy")) duration = 150; // 2h 30m
    else if (s.title.includes("Medium")) duration = 180; // 3h
    else if (s.title.includes("Hard")) duration = 120; // 2h
    else if (s.title.includes("Expert")) duration = 120; // 2h
    
    if (duration > 0) {
      await prisma.hackathon.update({
        where: { id: s.id },
        data: {
          parentHackathonId: h.id,
          endDate: new Date(s.startDate.getTime() + duration * 60000)
        }
      });
      console.log(`Updated ${s.title}: Set duration to ${duration}m and linked to MRDU Hackathon.`);
    }
  }
}

main().finally(() => prisma.$disconnect());
