import { redirect } from "next/navigation";

export default function UserAnalyticsRedirect() {
  redirect("/admin/users?tab=analytics");
}
