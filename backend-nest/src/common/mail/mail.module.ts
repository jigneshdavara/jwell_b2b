import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { existsSync } from 'fs';
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
                const mailEncryption =
                    process.env.MAIL_ENCRYPTION?.toLowerCase();
                const mailScheme = process.env.MAIL_SCHEME?.toLowerCase();
                const mailUsername = process.env.MAIL_USERNAME;
                const mailPassword = process.env.MAIL_PASSWORD;

                // Determine secure connection:
                // - Port 465 always uses SSL (secure: true)
                // - MAIL_ENCRYPTION=ssl means secure: true
                // - MAIL_ENCRYPTION=tls means secure: false, requireTLS: true
                // - MAIL_SCHEME=https means secure: true (backward compatibility)
                const isSecure =
                    mailPort === 465 ||
                    mailEncryption === 'ssl' ||
                    mailScheme === 'https';

                interface TransportConfig {
                    host: string;
                    port: number;
                    secure: boolean;
                    auth?: {
                        user: string;
                        pass: string;
                    };
                    requireTLS?: boolean;
                }

                const transportConfig: TransportConfig = {
                    host: mailHost,
                    port: mailPort,
                    secure: isSecure,
                    auth:
                        mailUsername && mailPassword
                            ? {
                                  user: mailUsername,
                                  pass: mailPassword,
                              }
                            : undefined,
                };

                // For TLS on port 587, require TLS
                if (
                    mailEncryption === 'tls' ||
                    (!isSecure && mailPort === 587)
                ) {
                    transportConfig.requireTLS = true;
                }

                return transportConfig;
            })(),
            defaults: {
                from: `"${process.env.MAIL_FROM_NAME || 'Elvee'}" <${process.env.MAIL_FROM_ADDRESS || 'hello@example.com'}>`,
            },
            template: {
                dir: (() => {
                    // Templates are copied to dist/common/mail/templates by nest-cli.json
                    // In development: use src/common/mail/templates
                    // In production: use dist/common/mail/templates

                    // Check if we're in production (dist directory exists)
                    const distTemplateDir = join(
                        process.cwd(),
                        'dist',
                        'common',
                        'mail',
                        'templates',
                    );

                    // Check if we're in development (src directory)
                    const srcTemplateDir = join(
                        process.cwd(),
                        'src',
                        'common',
                        'mail',
                        'templates',
                    );

                    // In production, templates are in dist/common/mail/templates
                    if (existsSync(distTemplateDir)) {
                        return distTemplateDir;
                    }

                    // In development, use src directory
                    if (existsSync(srcTemplateDir)) {
                        return srcTemplateDir;
                    }

                    // Fallback: try __dirname (for compiled code)
                    const templateDir = join(__dirname, 'templates');
                    if (existsSync(templateDir)) {
                        return templateDir;
                    }

                    // Last resort: return dist path (will error if templates don't exist)
                    return distTemplateDir;
                })(),
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
