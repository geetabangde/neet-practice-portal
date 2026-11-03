import { redirect } from "next/navigation";

// The admin panel has no page at "/". Go to the dashboard.
export default function Home() {
  redirect("/dashboard");
}
