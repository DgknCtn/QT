"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Auth helpers ──────────────────────────────────────────────────────────

async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

async function requireAdmin() {
  const user = await getSessionUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") throw new Error("Not authorized");
  return dbUser;
}

async function ensureUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email ?? "", role: "STUDENT" },
  });
  return dbUser;
}

// ─── Mentee actions ────────────────────────────────────────────────────────

export async function requestMenteeAccess() {
  const user = await ensureUser();
  await prisma.menteeProfile.upsert({
    where:  { userId: user.id },
    update: {},
    create: { userId: user.id, status: "PENDING" },
  });
  revalidatePath("/mentorship");
}

export async function approveMentee(userId: string) {
  await requireAdmin();
  await prisma.menteeProfile.update({
    where:  { userId },
    data:   { status: "ACTIVE", approvedAt: new Date() },
  });
  revalidatePath("/mentorship/admin/mentees");
}

export async function rejectMentee(userId: string) {
  await requireAdmin();
  await prisma.menteeProfile.update({
    where: { userId },
    data:  { status: "REJECTED" },
  });
  revalidatePath("/mentorship/admin/mentees");
}

// ─── Course actions ────────────────────────────────────────────────────────

export async function saveCourse(formData: FormData) {
  await requireAdmin();
  const id          = formData.get("id") as string | null;
  const title       = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const isPublished = formData.get("isPublished") === "true";

  if (id) {
    await prisma.course.update({ where: { id }, data: { title, description, isPublished } });
  } else {
    const maxOrder = await prisma.course.aggregate({ _max: { order: true } });
    await prisma.course.create({ data: { title, description, isPublished, order: (maxOrder._max.order ?? 0) + 1 } });
  }
  revalidatePath("/mentorship/admin/courses");
  revalidatePath("/mentorship");
}

export async function deleteCourse(id: string) {
  await requireAdmin();
  await prisma.course.delete({ where: { id } });
  revalidatePath("/mentorship/admin/courses");
  revalidatePath("/mentorship");
}

export async function toggleCoursePublished(id: string, current: boolean) {
  await requireAdmin();
  await prisma.course.update({ where: { id }, data: { isPublished: !current } });
  revalidatePath("/mentorship/admin/courses");
  revalidatePath("/mentorship");
}

// ─── Chapter actions ───────────────────────────────────────────────────────

export async function saveChapter(formData: FormData) {
  await requireAdmin();
  const id          = formData.get("id") as string | null;
  const courseId    = formData.get("courseId") as string;
  const title       = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;

  if (id) {
    await prisma.chapter.update({ where: { id }, data: { title, description } });
  } else {
    const maxOrder = await prisma.chapter.aggregate({ where: { courseId }, _max: { order: true } });
    await prisma.chapter.create({ data: { courseId, title, description, order: (maxOrder._max.order ?? 0) + 1 } });
  }
  revalidatePath(`/mentorship/admin/courses/${courseId}`);
}

export async function deleteChapter(id: string, courseId: string) {
  await requireAdmin();
  await prisma.chapter.delete({ where: { id } });
  revalidatePath(`/mentorship/admin/courses/${courseId}`);
}

// ─── Lesson actions ────────────────────────────────────────────────────────

export async function saveLesson(formData: FormData) {
  await requireAdmin();
  const id          = formData.get("id") as string | null;
  const chapterId   = formData.get("chapterId") as string;
  const courseId    = formData.get("courseId") as string;
  const title       = formData.get("title") as string;
  const content     = (formData.get("content") as string)     || null;
  const videoUrl    = (formData.get("videoUrl") as string)    || null;
  const documentUrl = (formData.get("documentUrl") as string) || null;
  const isPublished = formData.get("isPublished") !== "false";

  if (id) {
    await prisma.lesson.update({ where: { id }, data: { title, content, videoUrl, documentUrl, isPublished } });
  } else {
    const maxOrder = await prisma.lesson.aggregate({ where: { chapterId }, _max: { order: true } });
    await prisma.lesson.create({
      data: { chapterId, title, content, videoUrl, documentUrl, isPublished, order: (maxOrder._max.order ?? 0) + 1 },
    });
  }
  revalidatePath(`/mentorship/admin/courses/${courseId}`);
  redirect(`/mentorship/admin/courses/${courseId}`);
}

export async function deleteLesson(id: string, courseId: string) {
  await requireAdmin();
  await prisma.lesson.delete({ where: { id } });
  revalidatePath(`/mentorship/admin/courses/${courseId}`);
}

// ─── Progress actions ──────────────────────────────────────────────────────

export async function markLessonComplete(lessonId: string) {
  const user = await ensureUser();
  await prisma.lessonProgress.upsert({
    where:  { userId_lessonId: { userId: user.id, lessonId } },
    update: {},
    create: { userId: user.id, lessonId },
  });
  revalidatePath("/mentorship");
}

export async function unmarkLessonComplete(lessonId: string) {
  const user = await ensureUser();
  await prisma.lessonProgress.deleteMany({ where: { userId: user.id, lessonId } });
  revalidatePath("/mentorship");
}

// ─── Resource actions ──────────────────────────────────────────────────────

export async function saveResource(formData: FormData) {
  await requireAdmin();
  const id          = formData.get("id") as string | null;
  const title       = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const type        = formData.get("type") as "VIDEO" | "DOCUMENT" | "LINK" | "IMAGE";
  const url         = formData.get("url") as string;
  const category    = (formData.get("category") as string) || null;

  if (id) {
    await prisma.resource.update({ where: { id }, data: { title, description, type, url, category } });
  } else {
    const maxOrder = await prisma.resource.aggregate({ _max: { order: true } });
    await prisma.resource.create({ data: { title, description, type, url, category, order: (maxOrder._max.order ?? 0) + 1 } });
  }
  revalidatePath("/mentorship/admin/resources");
  revalidatePath("/mentorship/resources");
}

export async function deleteResource(id: string) {
  await requireAdmin();
  await prisma.resource.delete({ where: { id } });
  revalidatePath("/mentorship/admin/resources");
  revalidatePath("/mentorship/resources");
}

// ─── Mentor Notes ─────────────────────────────────────────────────────────

export async function addMentorNote(menteeId: string, formData: FormData) {
  await requireAdmin();
  const content = (formData.get("content") as string)?.trim();
  if (!content) return;
  await prisma.mentorNote.create({ data: { menteeId, content } });
  revalidatePath(`/mentorship/admin/mentees/${menteeId}`);
}

export async function deleteMentorNote(noteId: string, menteeId: string) {
  await requireAdmin();
  await prisma.mentorNote.delete({ where: { id: noteId } });
  revalidatePath(`/mentorship/admin/mentees/${menteeId}`);
}

// ─── Admin: set user role ──────────────────────────────────────────────────

export async function setAdminRole(targetUserId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: targetUserId }, data: { role: "ADMIN" } });
  revalidatePath("/mentorship/admin/mentees");
}
