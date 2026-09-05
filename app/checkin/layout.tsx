import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";

export default async function CheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getSessionRole();
  if (role !== "admin" && role !== "checkin") redirect("/login");
  return <>{children}</>;
}
