import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import ConfiguratorClient from "@/app/app/ConfiguratorClient";
import { getTenantPrimaryWidget } from "@/lib/widget-service";

export default async function AppHomePage() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  const widget = await getTenantPrimaryWidget(session.tenantId);

  return <ConfiguratorClient tenantName={session.tenantName} initialWidget={widget} />;
}
