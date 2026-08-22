import { prisma } from "./prisma";

export async function generateAndSaveOtp(email: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

  // Clear previous OTPs for this email to prevent spam/confusion
  await prisma.candidateOtp.deleteMany({
    where: { email: cleanEmail }
  });

  await prisma.candidateOtp.create({
    data: {
      email: cleanEmail,
      otp,
      expiresAt
    }
  });
  
  return otp;
}

export async function verifyOtp(email: string, inputOtp: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  
  const record = await prisma.candidateOtp.findFirst({
    where: { 
      email: cleanEmail,
      otp: inputOtp.trim()
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) return false;

  if (new Date() > record.expiresAt) {
    await prisma.candidateOtp.delete({ where: { id: record.id } });
    return false;
  }

  // Delete all OTPs for this email after successful verification
  await prisma.candidateOtp.deleteMany({
    where: { email: cleanEmail }
  });

  return true;
}
