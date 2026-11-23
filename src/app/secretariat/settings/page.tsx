import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/secretariat/settings-form";

export const metadata: Metadata = { title: "Conference settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="card card-pad max-w-2xl">
      <SettingsForm settings={settings} />
    </div>
  );
}
