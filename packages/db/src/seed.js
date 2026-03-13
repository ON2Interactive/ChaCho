import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tenantId = "5b7fe2b8-3c16-4b72-a72d-bf0000000001";
const userId = "00000000-0000-0000-0000-000000000001";
const widgetId = "8e5019cc-fd63-46e8-896f-9bf69d710001";
const membershipId = "6b9029cc-fd63-46e8-896f-9bf69d710002";

async function main() {
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {
      name: "Demo Tenant",
      slug: "demo-tenant",
      status: "ACTIVE",
    },
    create: {
      id: tenantId,
      name: "Demo Tenant",
      slug: "demo-tenant",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: "owner@demo.chacho.local",
      name: "Demo Owner",
      passwordHash: "$2b$10$CWQEJD0KDW1nWy4L80inDealtkQLRal38M19NcAtbmLJB2oq5VOTa",
    },
    create: {
      id: userId,
      email: "owner@demo.chacho.local",
      name: "Demo Owner",
      passwordHash: "$2b$10$CWQEJD0KDW1nWy4L80inDealtkQLRal38M19NcAtbmLJB2oq5VOTa",
    },
  });

  await prisma.membership.upsert({
    where: { id: membershipId },
    update: {
      tenantId,
      userId,
      role: "OWNER",
    },
    create: {
      id: membershipId,
      tenantId,
      userId,
      role: "OWNER",
    },
  });

  await prisma.widget.upsert({
    where: { id: widgetId },
    update: {
      tenantId,
      name: "Main site widget",
      publicKey: "local_dev_widget",
      isActive: true,
      domainAllowlist: ["localhost", "127.0.0.1"],
      themeJson: {
        primaryColor: "#c86b3c",
        position: "right",
        title: "Chat with us",
        subtitle: "We usually reply within a few minutes.",
      },
    },
    create: {
      id: widgetId,
      tenantId,
      name: "Main site widget",
      publicKey: "local_dev_widget",
      isActive: true,
      domainAllowlist: ["localhost", "127.0.0.1"],
      themeJson: {
        primaryColor: "#c86b3c",
        position: "right",
        title: "Chat with us",
        subtitle: "We usually reply within a few minutes.",
      },
    },
  });

  console.log("Seed complete.");
  console.log("Login email: owner@demo.chacho.local");
  console.log("Login password: password123");
  console.log("Widget key: local_dev_widget");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
