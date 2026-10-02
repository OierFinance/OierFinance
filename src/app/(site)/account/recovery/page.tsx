import type { Metadata } from "next";
import { RecoveryPage } from "@/components/account/RulesRecovery";

export const metadata: Metadata = { title: "Recovery", robots: { index: false } };

export default function Page() {
  return <RecoveryPage />;
}
