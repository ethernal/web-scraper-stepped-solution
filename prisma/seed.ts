// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // we're using upsert to make sure we're not trying to insert same data twice (it will error out)
	await prisma.user.upsert({
    create: {
      email: `admin@example.com`,
			firstName: 'Admin',
			lastName: 'Super',
		},
		update: {
      firstName: 'Admin',
			lastName: 'Super',
		},
    where: { email: `admin@example.com` },
	});
}

console.log('Seeding the database');
main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
    await prisma.$disconnect();
    console.log('Completed seeding the database');
	});
