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
      <NightHero title="What people actually ask their account to do" sub="Every rule on this page started as one sentence. Run any of them in the account beside the list, read the logic it becomes, and apply it if the check passes." />
      <UseCases />
      <CtaBand title="Your rule is not on this page yet" body="Write it in your own words in the Rule Studio. If the drafter cannot read it yet, it says so instead of guessing." />
    </>
  );
}
