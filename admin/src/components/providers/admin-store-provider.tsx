"use client";

import { createContext, useContext, type ReactNode } from "react";
import { notificationsData } from "@/data/notifications";
import { paymentsData } from "@/data/payments";
import { plansData } from "@/data/plans";
import { questionsData } from "@/data/questions";
import { resultsData } from "@/data/results";
import { studentsData } from "@/data/students";
import { subjectsData } from "@/data/subjects";
import { testsData } from "@/data/tests";
import { topicsData } from "@/data/topics";
import { useCollection, type Collection } from "@/hooks/use-collection";
import type {
  AdminNotification,
  MockTest,
  Payment,
  Plan,
  Question,
  Student,
  Subject,
  TestResult,
  Topic,
} from "@/types";

// All admin data in one place. It starts from the dummy data in src/data and lives in React
// state, so adds, edits and deletes show up on every page until the browser is refreshed.
// When the backend exists, this is the one file that changes: it will load and save through
// the API instead of keeping the lists in state.
interface AdminStore {
  students: Collection<Student>;
  subjects: Collection<Subject>;
  topics: Collection<Topic>;
  questions: Collection<Question>;
  tests: Collection<MockTest>;
  plans: Collection<Plan>;
  notifications: Collection<AdminNotification>;
  // Read-only lists
  results: TestResult[];
  payments: Payment[];
  // Deleting also removes everything that belongs to the item
  removeSubject: (id: string) => void;
  removeTopic: (id: string) => void;
  removeQuestion: (id: string) => void;
}

const StoreContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const students = useCollection(studentsData);
  const subjects = useCollection(subjectsData);
  const topics = useCollection(topicsData);
  const questions = useCollection(questionsData);
  const tests = useCollection(testsData);
  const plans = useCollection(plansData);
  const notifications = useCollection(notificationsData);

  // Takes deleted questions out of every test, so test totals stay correct
  const stripFromTests = (removed: Set<string>) => {
    if (removed.size === 0) return;
    tests.setItems((prev) =>
      prev.map((test) => ({ ...test, questionIds: test.questionIds.filter((id) => !removed.has(id)) })),
    );
  };

  const removeQuestion = (id: string) => {
    questions.remove(id);
    stripFromTests(new Set([id]));
  };

  const removeTopic = (id: string) => {
    const removed = new Set(questions.items.filter((q) => q.topicId === id).map((q) => q.id));
    topics.remove(id);
    questions.setItems((prev) => prev.filter((q) => q.topicId !== id));
    tests.setItems((prev) => prev.map((t) => ({ ...t, topicIds: t.topicIds.filter((topicId) => topicId !== id) })));
    stripFromTests(removed);
  };

  const removeSubject = (id: string) => {
    const removed = new Set(questions.items.filter((q) => q.subjectId === id).map((q) => q.id));
    subjects.remove(id);
    topics.setItems((prev) => prev.filter((t) => t.subjectId !== id));
    questions.setItems((prev) => prev.filter((q) => q.subjectId !== id));
    tests.setItems((prev) =>
      prev.map((t) => ({
        ...t,
        subjectIds: t.subjectIds.filter((subjectId) => subjectId !== id),
        topicIds: t.topicIds.filter((topicId) => topics.items.find((x) => x.id === topicId)?.subjectId !== id),
      })),
    );
    stripFromTests(removed);
  };

  const value: AdminStore = {
    students,
    subjects,
    topics,
    questions,
    tests,
    plans,
    notifications,
    results: resultsData,
    payments: paymentsData,
    removeSubject,
    removeTopic,
    removeQuestion,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAdminStore(): AdminStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useAdminStore must be used inside <AdminStoreProvider>");
  return store;
}
