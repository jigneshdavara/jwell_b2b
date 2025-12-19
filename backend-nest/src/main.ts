import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors();

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

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
