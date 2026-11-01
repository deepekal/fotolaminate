import DashboardPage from "@/screens/Dashboard";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
  alternates: { canonical: "/dashboard" },
};

export default function Page() {
  return <DashboardPage />;
}
