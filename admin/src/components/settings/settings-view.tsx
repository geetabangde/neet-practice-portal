"use client";

import { PageHeader } from "@/components/common/page-header";
import { ProfileSettings } from "./profile-settings";

export function SettingsView() {
  return (
    <>
      <PageHeader title="Admin settings" description="Your name and contact details." />
      <div className="max-w-3xl">
        <ProfileSettings />
      </div>
    </>
  );
}
