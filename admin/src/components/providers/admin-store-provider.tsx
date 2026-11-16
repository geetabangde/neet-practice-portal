"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { notificationsData } from "@/data/notifications";
import { paymentsData } from "@/data/payments";
import { resultsData } from "@/data/results";
import { useCollection, type Collection } from "@/hooks/use-collection";
import { fetchModules } from "@/lib/modules-api";
import { fetchPlans } from "@/lib/plans-api";
import { fetchQuestions } from "@/lib/questions-api";
import { fetchStudents } from "@/lib/students-api";
import { fetchSubjects } from "@/lib/subjects-api";
import { fetchTests } from "@/lib/tests-api";
import { fetchTopics } from "@/lib/topics-api";
import type {
  AdminNotification,
  MockTest,
  Module,
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
  // Subjects, topics, questions, tests and plans live in the database. They load when the admin opens the panel.
  subjects: Collection<Subject>;
  modules: Collection<Module>;
  contentStatus: "loading" | "ready" | "error";
  reloadContent: () => void;
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
  removeModule: (id: string) => void;
  removeTopic: (id: string) => void;
  removeQuestion: (id: string) => void;
}

const StoreContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const students = useCollection<Student>([]);
  const { setItems: setStudents } = students;
  const subjects = useCollection<Subject>([]);
  const [contentStatus, setContentStatus] = useState<"loading" | "ready" | "error">("loading");
  const [contentAttempt, setContentAttempt] = useState(0);
  const { setItems: setSubjects } = subjects;
  const modules = useCollection<Module>([]);
  const { setItems: setModules } = modules;
  const topics = useCollection<Topic>([]);
  const { setItems: setTopics } = topics;
  const questions = useCollection<Question>([]);
  const { setItems: setQuestions } = questions;
  const tests = useCollection<MockTest>([]);
  const { setItems: setTests } = tests;
  const plans = useCollection<Plan>([]);
  const { setItems: setPlans } = plans;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [result, modulesResult, topicsResult, questionsResult, testsResult, plansResult, studentsResult] = await Promise.all([
        fetchSubjects(),
        fetchModules(),
        fetchTopics(),
        fetchQuestions(),
        fetchTests(),
        fetchPlans(),
        fetchStudents(),
      ]);
      if (cancelled) return;
      if (result.ok && modulesResult.ok && topicsResult.ok && questionsResult.ok && testsResult.ok && plansResult.ok && studentsResult.ok) {
        setSubjects(result.data);
        setModules(modulesResult.data);
        setTopics(topicsResult.data);
        setQuestions(questionsResult.data);
        setTests(testsResult.data);
        setPlans(plansResult.data);
        setStudents(studentsResult.data);
        setContentStatus("ready");
      } else {
        setContentStatus("error");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [setSubjects, setModules, setTopics, setQuestions, setTests, setPlans, setStudents, contentAttempt]);

  const reloadContent = useCallback(() => {
    setContentStatus("loading");
    setContentAttempt((value) => value + 1);
  }, []);
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

  const removeModule = (id: string) => {
    const topicIds = new Set(topics.items.filter((t) => t.moduleId === id).map((t) => t.id));
    const removed = new Set(questions.items.filter((q) => topicIds.has(q.topicId)).map((q) => q.id));
    modules.remove(id);
    topics.setItems((prev) => prev.filter((t) => t.moduleId !== id));
    questions.setItems((prev) => prev.filter((q) => !topicIds.has(q.topicId)));
    tests.setItems((prev) => prev.map((t) => ({ ...t, topicIds: t.topicIds.filter((topicId) => !topicIds.has(topicId)) })));
    stripFromTests(removed);
  };

  const removeSubject = (id: string) => {
    const removed = new Set(questions.items.filter((q) => q.subjectId === id).map((q) => q.id));
    subjects.remove(id);
    modules.setItems((prev) => prev.filter((m) => m.subjectId !== id));
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
    modules,
    contentStatus,
    reloadContent,
    topics,
    questions,
    tests,
    plans,
    notifications,
    results: resultsData,
    payments: paymentsData,
    removeSubject,
    removeModule,
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
