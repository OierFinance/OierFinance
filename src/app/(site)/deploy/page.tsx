import type { Metadata } from "next";
import { DeployPanel } from "@/components/account/Deploy";

export const metadata: Metadata = { title: "Deploy", robots: { index: false } };

export default function Page() {
  return <DeployPanel />;
}
