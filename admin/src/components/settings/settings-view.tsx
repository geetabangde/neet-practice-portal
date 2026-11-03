"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs } from "@/components/ui/tabs";
import { GeneralSettings } from "./general-settings";
import { NotificationPreferences } from "./notification-preferences";
import { ProfileSettings } from "./profile-settings";
import { SecuritySettings } from "./security-settings";

type SettingsTab = "profile" | "security" | "general" | "notifications";

export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>("profile");

  return (
    <>
      <PageHeader title="Admin settings" description="Your profile, security, platform details and notification preferences." />

      <Tabs
        variant="underline"
        ariaLabel="Settings sections"
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { value: "profile", label: "Profile" },
          { value: "security", label: "Security" },
          { value: "general", label: "General" },
          { value: "notifications", label: "Notifications" },
        ]}
      />

      <div className="max-w-3xl">
        {tab === "profile" ? <ProfileSettings /> : null}
        {tab === "security" ? <SecuritySettings /> : null}
        {tab === "general" ? <GeneralSettings /> : null}
        {tab === "notifications" ? <NotificationPreferences /> : null}
      </div>
    </>
  );
}
