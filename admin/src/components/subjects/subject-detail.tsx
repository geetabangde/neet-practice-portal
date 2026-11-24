"use client";

import { ArrowLeft, BookOpen, Clock, FileQuestion, Layers, LayoutList, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { ActiveBadge } from "@/components/common/status-badges";
import { SubjectIcon } from "@/components/common/subject-icon";
import { useAdminStore } from "@/components/providers/admin-store-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, IconButton, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { plural } from "@/lib/format";
import { deleteModule } from "@/lib/modules-api";
import { topicQuestionCount } from "@/lib/selectors";
import { deleteTopic } from "@/lib/topics-api";
import type { Module, Topic } from "@/types";
import { ModuleFormModal, type ModuleModalState } from "./module-form-modal";
import { TopicFormModal, type TopicModalState } from "./topic-form-modal";

// Lists were loaded newest first, but a curriculum reads best in the order it was made
const byCreation = <T extends { id: string }>(a: T, b: T) => Number(a.id) - Number(b.id);

// The page behind the eye button of a subject: its modules, and the topics inside each module.
// Modules and topics are added, edited and deleted here, so they need no menu entry of their own.
export function SubjectDetail({ id }: { id: string }) {
  const { subjects, modules, topics, questions, contentStatus, reloadContent, removeModule, removeTopic } = useAdminStore();
  const toast = useToast();

  const [moduleModal, setModuleModal] = useState<ModuleModalState>(null);
  const [topicModal, setTopicModal] = useState<TopicModalState>(null);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null);

  const subject = subjects.items.find((s) => s.id === id);

  // Opened straight from a link: wait for the server before saying the subject is missing
  if (!subject && contentStatus === "loading") {
    return (
      <p role="status" className="py-16 text-center text-sm text-slate-500">
        Loading subject…
      </p>
    );
  }
  if (!subject) {
    return (
      <Card>
        <EmptyState
          icon={BookOpen}
          title={contentStatus === "error" ? "Could not load the subject" : "Subject not found"}
          description={
            contentStatus === "error"
              ? "The server did not respond. Check that the backend is running."
              : "This subject does not exist. It may have been deleted."
          }
          action={
            contentStatus === "error" ? (
              <Button onClick={reloadContent}>Try again</Button>
            ) : (
              <Link href="/subjects" className={buttonStyles()}>
                Back to subjects
              </Link>
            )
          }
        />
      </Card>
    );
  }

  const subjectModules = modules.items.filter((m) => m.subjectId === subject.id).sort(byCreation);
  const topicsOf = (moduleId: string) => topics.items.filter((t) => t.moduleId === moduleId).sort(byCreation);
  const questionsOf = (moduleId: string) => topicsOf(moduleId).reduce((sum, t) => sum + topicQuestionCount(t.id, questions.items), 0);

  const totalTopics = subjectModules.reduce((sum, m) => sum + topicsOf(m.id).length, 0);
  const totalQuestions = subjectModules.reduce((sum, m) => sum + questionsOf(m.id), 0);

  async function confirmDeleteModule(module: Module) {
    const result = await deleteModule(module.id);
    // 404 = already gone, so the list should drop it too
    if (!result.ok && result.status !== 404) {
      return toast({ title: "Could not delete the module", description: result.message, tone: "error" });
    }
    removeModule(module.id);
    toast({ title: "Module deleted", description: `${module.name} and its topics were removed.` });
  }

  async function confirmDeleteTopic(topic: Topic) {
    const result = await deleteTopic(topic.id);
    if (!result.ok && result.status !== 404) {
      return toast({ title: "Could not delete the topic", description: result.message, tone: "error" });
    }
    removeTopic(topic.id);
    toast({ title: "Topic deleted", description: `${topic.name} and its questions were removed.` });
  }

  const moduleStats = deletingModule
    ? { topics: topicsOf(deletingModule.id).length, questions: questionsOf(deletingModule.id) }
    : null;

  return (
    <>
      <Link href="/subjects" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to subjects
      </Link>

      <PageHeader
        title={subject.name}
        description={subject.description || "Modules of this subject, and the topics inside each module."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/questions?subjectId=${subject.id}`}
              className={buttonStyles({ variant: "outline" })}
            >
              <FileQuestion className="h-4 w-4" aria-hidden="true" />
              Question Bank
            </Link>
            <Link
              href={`/questions/new?subjectId=${subject.id}`}
              className={buttonStyles({ variant: "outline" })}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add question
            </Link>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModuleModal("new")}>
              Add module
            </Button>
          </div>
        }
      />

      <Card className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
        <div className="flex items-center gap-3">
          <SubjectIcon icon={subject.icon} size="md" />
          <ActiveBadge status={subject.status} />
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <LayoutList className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <dt className="sr-only">Modules</dt>
            <dd>{plural(subjectModules.length, "module")}</dd>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Layers className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <dt className="sr-only">Topics</dt>
            <dd>{plural(totalTopics, "topic")}</dd>
          </div>
          <Link
            href={`/questions?subjectId=${subject.id}`}
            className="flex items-center gap-2 text-slate-600 transition hover:text-indigo-600"
            title="View all questions of this subject in Question Bank"
          >
            <FileQuestion className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <dt className="sr-only">Questions</dt>
            <dd className="underline-offset-4 hover:underline">{plural(totalQuestions, "question")}</dd>
          </Link>
        </dl>
      </Card>

      {subjectModules.length === 0 ? (
        <Card>
          <EmptyState
            icon={LayoutList}
            title="No modules yet"
            description="Add the first module of this subject. Topics are added inside a module."
            action={<Button onClick={() => setModuleModal("new")}>Add module</Button>}
          />
        </Card>
      ) : (
        <ul className="space-y-4">
          {subjectModules.map((module) => {
            const moduleTopics = topicsOf(module.id);
            return (
              <li key={module.id}>
                <Card className={module.status === "inactive" ? "opacity-80" : undefined}>
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">{module.name}</h2>
                        <ActiveBadge status={module.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {plural(moduleTopics.length, "topic")} · {plural(questionsOf(module.id), "question")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setTopicModal({ moduleId: module.id, topic: null })}>
                        Add topic
                      </Button>
                      <IconButton label={`Edit module ${module.name}`} onClick={() => setModuleModal(module)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton label={`Delete module ${module.name}`} onClick={() => setDeletingModule(module)} className="hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>

                  {moduleTopics.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-slate-500">No topics in this module yet. Use “Add topic” to create the first one.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {moduleTopics.map((topic) => {
                        const count = topicQuestionCount(topic.id, questions.items);
                        return (
                          <li key={topic.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{topic.name}</span>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {topic.durationMinutes || 15} min
                            </span>
                            <ActiveBadge status={topic.status} />

                            <Link
                              href={`/questions?subjectId=${subject.id}&topicId=${topic.id}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                              title="View questions of this topic in Question Bank"
                            >
                              <FileQuestion className="h-3.5 w-3.5 text-slate-400" />
                              {plural(count, "question")}
                            </Link>

                            <Link
                              href={`/questions/new?subjectId=${subject.id}&moduleId=${module.id}&topicId=${topic.id}`}
                              className={buttonStyles({ variant: "outline", size: "sm" })}
                              title={`Add question to ${topic.name}`}
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              Add question
                            </Link>

                            <div className="flex items-center gap-0.5">
                              <IconButton label={`Edit topic ${topic.name}`} onClick={() => setTopicModal({ moduleId: topic.moduleId, topic })}>
                                <Pencil className="h-4 w-4" />
                              </IconButton>
                              <IconButton label={`Delete topic ${topic.name}`} onClick={() => setDeletingTopic(topic)} className="hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ModuleFormModal subject={subject} state={moduleModal} onClose={() => setModuleModal(null)} />
      <TopicFormModal modulesOfSubject={subjectModules} state={topicModal} onClose={() => setTopicModal(null)} />

      <ConfirmDialog
        open={deletingModule !== null}
        onClose={() => setDeletingModule(null)}
        onConfirm={() => {
          if (deletingModule) void confirmDeleteModule(deletingModule);
        }}
        title="Delete this module?"
        description={
          deletingModule && moduleStats ? (
            <>
              <strong className="text-slate-900">{deletingModule.name}</strong> will be deleted together with{" "}
              <strong>{plural(moduleStats.topics, "topic")}</strong> and <strong>{plural(moduleStats.questions, "question")}</strong>. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete module"
      />

      <ConfirmDialog
        open={deletingTopic !== null}
        onClose={() => setDeletingTopic(null)}
        onConfirm={() => {
          if (deletingTopic) void confirmDeleteTopic(deletingTopic);
        }}
        title="Delete this topic?"
        description={
          deletingTopic ? (
            <>
              <strong className="text-slate-900">{deletingTopic.name}</strong> will be deleted together with{" "}
              <strong>{plural(topicQuestionCount(deletingTopic.id, questions.items), "question")}</strong>. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete topic"
      />
    </>
  );
}
