/**
 * One-time migration: sets a default password for users that were created
 * before the password field was added to the schema.
 *
 * Default password: WorShipr@2025
 * — Users should change this after first login.
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const DEFAULT_PASSWORD = "WorShipr@2025";
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // MongoDB: update all documents where password field does not exist
  const result = await prisma.$runCommandRaw({
    update: "User",
    updates: [
      {
        q: { password: { $exists: false } },
        u: { $set: { password: hashed } },
        multi: true,
      },
    ],
  });

  console.log("Migration result:", JSON.stringify(result, null, 2));
  console.log(`\n✅ Done. Default password set to: ${DEFAULT_PASSWORD}`);
  console.log("   Tell your users to update their password after first login.\n");
}

main()
  .catch((e) => { console.error("❌ Migration failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
