import { redirect } from "next/navigation";

export default function StudentLoginAlias() {
  redirect("/login?role=student");
}
