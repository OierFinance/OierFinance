import type { Metadata } from "next";
import { QueuePage } from "@/components/account/SendQueue";

export const metadata: Metadata = { title: "Queue", robots: { index: false } };

export default function Page() {
  return <QueuePage />;
}
