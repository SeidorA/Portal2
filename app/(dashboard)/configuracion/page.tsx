import { redirect } from "next/navigation";

export default function ConfiguracionPage() {
  redirect("/perfil?tab=preferencias");
}
