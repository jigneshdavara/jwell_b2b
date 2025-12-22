import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        MailerModule.forRoot({
            transport: (() => {
                const mailDriver = process.env.MAIL_MAILER || 'log';

                // For development, use log transport if MAIL_MAILER is 'log'
                if (mailDriver === 'log') {
                    return {
                        jsonTransport: true, // Log emails as JSON instead of sending
                    };
                }

                const mailHost = process.env.MAIL_HOST || '127.0.0.1';
                const mailPort = parseInt(process.env.MAIL_PORT || '2525', 10);
                const mailScheme = process.env.MAIL_SCHEME;
                const mailUsername = process.env.MAIL_USERNAME;
                const mailPassword = process.env.MAIL_PASSWORD;

                return {
                    host: mailHost,
                    port: mailPort,
                    secure: mailScheme === 'https',
                    auth:
                        mailUsername && mailPassword
                            ? {
                                  user: mailUsername,
                                  pass: mailPassword,
                              }
                            : undefined,
                };
            })(),
            defaults: {
                from: `"${process.env.MAIL_FROM_NAME || 'Elvee'}" <${process.env.MAIL_FROM_ADDRESS || 'hello@example.com'}>`,
            },
            template: {
                dir: join(__dirname, 'templates'),
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true,
                },
            },
        }),
    ],
    controllers: [MailController],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
