import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const email = 'padarthidhanush@gmail.com';
  console.log(`Attempting to delete user with email: ${email}`);

  // Delete from candidates
  try {
    const candidate = await prisma.candidates.findUnique({ where: { email } });
    if (candidate) {
      await prisma.candidates.delete({ where: { email } });
      console.log(`Deleted from candidates: ${email}`);
    } else {
      console.log(`Not found in candidates: ${email}`);
    }
  } catch (e) {
    console.error(`Error deleting from candidates:`, e);
  }

  // Delete from Organizer
  try {
    const organizer = await prisma.organizer.findUnique({ where: { email } });
    if (organizer) {
      await prisma.organizer.delete({ where: { email } });
      console.log(`Deleted from Organizer: ${email}`);
    } else {
      console.log(`Not found in Organizer: ${email}`);
    }
  } catch (e) {
    console.error(`Error deleting from Organizer:`, e);
  }

  // Delete from SprintParticipant
  try {
    const participants = await prisma.sprintParticipant.deleteMany({ where: { email } });
    console.log(`Deleted ${participants.count} records from SprintParticipant for ${email}`);
  } catch (e) {
    console.error(`Error deleting from SprintParticipant:`, e);
  }

  // Delete from SprintSubmission
  try {
    const submissions = await prisma.sprintSubmission.deleteMany({ where: { email } });
    console.log(`Deleted ${submissions.count} records from SprintSubmission for ${email}`);
  } catch (e) {
    console.error(`Error deleting from SprintSubmission:`, e);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
