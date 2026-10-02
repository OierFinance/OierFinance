import type { Metadata } from "next";
import { CtaBand, NightHero } from "@/components/site/parts";
import { UseCases } from "@/components/pages/UseCases";

export const metadata: Metadata = {
  title: "Use cases",
  description: "Rules people actually ask their account to keep, each written as one sentence.",
};

export default function UseCasesPage() {
  return (
    <>
      <NightHero title="Real situations, one sentence each" sub="Each card is a single instruction someone might give their account. Send any of them to the panel to see the logic it becomes and whether it clashes with your current rules." />
      <UseCases />
      <CtaBand title="Missing your situation?" body="Type it into the Rule Studio as you would say it. When the grammar cannot handle a sentence yet, it tells you rather than guessing." />
    </>
  );
}
