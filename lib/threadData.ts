"use server";

import { db } from "@/db";
import { thread } from "@/db/schema/chat-schema";
import { auth } from "./auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
export async function getThreads() {
  const getSession = await auth.api.getSession({
    headers: await headers(),
  });
  if (!getSession) {
    console.log(`User is not logged in or authorized `);
    return [];
  }
  const threadsData = await db
    .select({ id: thread.id, title: thread.title, createdAt: thread.createdAt })
    .from(thread)
    .where(eq(thread.userid, getSession?.user.id))
    .orderBy(desc(thread.createdAt));

  return threadsData;
}
