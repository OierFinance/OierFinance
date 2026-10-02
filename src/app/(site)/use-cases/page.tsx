import type { Metadata } from "next";
import { PageHero, CtaBand } from "@/components/site/parts";
import { UseCases } from "@/components/pages/UseCases";

export const metadata: Metadata = {
  title: "Use cases",
  description: "Rules people actually ask their account to keep, each written as one sentence.",
};

export default function UseCasesPage() {
  return (
    <>
      <PageHero tag="Use cases" title="What people ask their account to do" lead="Each of these started as a single sentence. The ones the preview grammar can read open in the Rule Studio, where they are drafted, checked and ready to test." />
      <section className="wrap section !pt-12">
        <UseCases />
      </section>
      <CtaBand title="Your rule is not listed?" body="Write it in the studio in your own words. If the drafter cannot read it yet, it says so instead of guessing." />
    </>
  );
}
