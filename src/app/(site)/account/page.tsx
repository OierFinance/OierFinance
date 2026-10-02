import type { Metadata } from "next";
import { AccountOverview } from "@/components/account/Overview";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function Page() {
  return <AccountOverview />;
}
