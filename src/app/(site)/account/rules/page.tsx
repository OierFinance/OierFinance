import type { Metadata } from "next";
import { RulesPage } from "@/components/account/RulesRecovery";

export const metadata: Metadata = { title: "Rules", robots: { index: false } };

export default function Page() {
  return <RulesPage />;
}
