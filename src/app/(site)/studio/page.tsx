import type { Metadata } from "next";
import { Studio } from "@/components/studio/Studio";

export const metadata: Metadata = {
  title: "Rule Studio",
  description: "Write a rule in plain English, see it as logic, check it against your other rules and simulate transfers against the set.",
};

export default function StudioPage() {
  return <Studio />;
}
