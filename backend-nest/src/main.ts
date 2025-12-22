import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Serve static files from public directory
    // Files in ./public/storage/ will be accessible at /storage/
    // This is served at root level, not under /api prefix
    app.useStaticAssets(join(process.cwd(), 'public'), {
        prefix: '/',
    });

    // Enable CORS with specific origin for Next.js frontend
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Set global prefix to match frontend expectations
    app.setGlobalPrefix('api');

    // Enable validation globally
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Handle BigInt serialization
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };

    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
