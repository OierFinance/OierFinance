import type { Metadata } from "next";
import { SendPage } from "@/components/account/SendQueue";

export const metadata: Metadata = { title: "Send", robots: { index: false } };

export default function Page() {
  return <SendPage />;
}
