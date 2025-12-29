import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Enable CORS
    app.enableCors();

    // Serve static files from public directory
    // This allows access to files like /storage/products/... without /api prefix
    app.useStaticAssets(join(process.cwd(), 'public'), {
        prefix: '/',
    });

    // Set global prefix to match frontend expectations
    app.setGlobalPrefix('api');

    // Enable validation globally
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // Handle BigInt serialization
    (BigInt.prototype as any).toJSON = function () {
        return this.toString();
    };

    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
