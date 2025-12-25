import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseSeeder } from './database.seeder';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prismaService = app.get(PrismaService);

    const seeder = new DatabaseSeeder(prismaService);
    await seeder.seed();

    await app.close();
    process.exit(0);
}

bootstrap().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});

