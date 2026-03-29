import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./prisma"

export interface UserOptions {
  includeVideos?: boolean;
}

export async function getCurrentUser(options?: UserOptions) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.warn("Unauthorized access attempt: No active session found.");
    return null;
  }

  // Use the immutable DB ID from the session token (dbId)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    include: {
      videos: options?.includeVideos ? {
        orderBy: { createdAt: "desc" }
      } : false,
    }
  });

  return user;
}

export async function requireUser(options?: UserOptions) {
  const user = await getCurrentUser(options);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
