"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { notificationsData } from "@/data/notifications";
import { paymentsData } from "@/data/payments";
import { useCollection, type Collection } from "@/hooks/use-collection";
import { fetchModules } from "@/lib/modules-api";
import { fetchPlans } from "@/lib/plans-api";
import { fetchQuestions } from "@/lib/questions-api";
import { fetchResults } from "@/lib/results-api";
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
  const [results, setResults] = useState<TestResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [result, modulesResult, topicsResult, questionsResult, testsResult, plansResult, studentsResult, resultsResult] = await Promise.all([
        fetchSubjects(),
        fetchModules(),
        fetchTopics(),
        fetchQuestions(),
        fetchTests(),
        fetchPlans(),
        fetchStudents(),
        fetchResults(),
      ]);
      if (cancelled) return;
      if (result.ok && modulesResult.ok && topicsResult.ok && questionsResult.ok && testsResult.ok && plansResult.ok && studentsResult.ok && resultsResult.ok) {
        setSubjects(result.data);
        setModules(modulesResult.data);
        setTopics(topicsResult.data);
        setQuestions(questionsResult.data);
        setTests(testsResult.data);
        setPlans(plansResult.data);
        setStudents(studentsResult.data);
        setResults(resultsResult.data);
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

  // The tests have their own questions, so deleting QBank questions, topics, modules or subjects never touches a test
  const removeQuestion = (id: string) => {
    questions.remove(id);
  };

  const removeTopic = (id: string) => {
    topics.remove(id);
    questions.setItems((prev) => prev.filter((q) => q.topicId !== id));
  };

  const removeModule = (id: string) => {
    const topicIds = new Set(topics.items.filter((t) => t.moduleId === id).map((t) => t.id));
    modules.remove(id);
    topics.setItems((prev) => prev.filter((t) => t.moduleId !== id));
    questions.setItems((prev) => prev.filter((q) => !topicIds.has(q.topicId)));
  };

  const removeSubject = (id: string) => {
    subjects.remove(id);
    modules.setItems((prev) => prev.filter((m) => m.subjectId !== id));
    topics.setItems((prev) => prev.filter((t) => t.subjectId !== id));
    questions.setItems((prev) => prev.filter((q) => q.subjectId !== id));
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
    results,
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
