import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch(Error)
export class MulterExceptionFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // Check if this is a Multer file validation error
        if (
            exception.message.includes('Invalid file type') ||
            exception.message.includes('File too large') ||
            exception.message.includes('File required') ||
            exception.message.includes('Unexpected field')
        ) {
            response.status(400).json({
                statusCode: 400,
                message: exception.message,
                error: 'Bad Request',
            });
            return;
        }

        // For other errors, rethrow to let default handler handle
        throw exception;
    }
}
