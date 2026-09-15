import { notFound } from 'next/navigation';
import LessonRunner from '@/components/lesson/LessonRunner';
import { subjects, getLesson, neighbours } from '@/data/curriculum';
import type { SubjectId } from '@/types/curriculum';

export function generateStaticParams() {
  return subjects.flatMap((s) =>
    s.lessons.map((l) => ({ subject: s.id, lessonId: l.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; lessonId: string }>;
}) {
  const { subject, lessonId } = await params;
  const found = getLesson(subject, lessonId);
  if (!found) return { title: 'Lesson not found' };
  return { title: `${found.lesson.title} — ${found.subject.name}`, description: found.lesson.hook };
}

// Next 15+ passes params as a Promise, so this page is async.
export default async function LessonPage({
  params,
}: {
  params: Promise<{ subject: string; lessonId: string }>;
}) {
  const { subject, lessonId } = await params;
  const found = getLesson(subject, lessonId);
  if (!found) notFound();

  const { next } = neighbours(found.subject.id as SubjectId, lessonId);

  return (
    <LessonRunner
      subject={found.subject}
      lesson={found.lesson}
      next={next}
    />
  );
}
