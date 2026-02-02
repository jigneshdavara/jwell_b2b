import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { createTransport, Transporter } from 'nodemailer';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { PrismaModule } from '../../prisma/prisma.module';

// Get template directory - use source directory in dev, dist in production
function getTemplateDir(): string {
    // In production/compiled code, __dirname points to dist/src/common/mail
    // In development with ts-node, we need to check if we're in dist or src
    const isProduction = __dirname.includes('dist');
    if (isProduction) {
        // In production, templates should be in dist/src/common/mail/templates
        return join(__dirname, 'templates');
    }
    // In development, use source directory
    return join(process.cwd(), 'src', 'common', 'mail', 'templates');
}

@Module({
    imports: [
        PrismaModule,
        MailerModule.forRootAsync({
            useFactory: () => {
                const mailDriver = process.env.MAIL_MAILER || 'log';
                console.log(
                    `[MailModule] Initializing with mail driver: ${mailDriver}`,
                );

                // For development, use a custom transport that logs emails
                if (mailDriver === 'log') {
                    console.log(
                        '[MailModule] Using log transport (streamTransport)',
                    );
                    // Use streamTransport which logs emails to console without SMTP
                    const logTransport: Transporter = createTransport({
                        streamTransport: true,
                    }) as Transporter;

                    // Create a verify method that never attempts connection
                    const verifyMethod = function verify(
                        callback?: (
                            err: Error | null,
                            success?: boolean,
                        ) => void,
                    ): Promise<boolean> {
                        console.log(
                            '[MailModule] verify() intercepted - returning success without connection',
                        );
                        // Return immediately resolved promise - no connection attempt
                        const promise = Promise.resolve(true);
                        if (callback) {
                            // Execute callback asynchronously to match nodemailer pattern
                            setImmediate(() => callback(null, true));
                        }
                        return promise;
                    };

                    // Wrap the entire transport in a Proxy to intercept ALL property access
                    // This ensures verify() is always intercepted, no matter how MailerService accesses it
                    const proxiedTransport = new Proxy(logTransport, {
                        get(target, prop, receiver) {
                            // Intercept verify() calls
                            if (prop === 'verify') {
                                console.log(
                                    '[MailModule] verify property accessed via Proxy',
                                );
                                return verifyMethod;
                            }

                            // For all other properties, return the original value
                            const value = Reflect.get(
                                target,
                                prop,
                                receiver,
                            ) as unknown | undefined;

                            // Bind methods to maintain 'this' context
                            if (typeof value === 'function') {
                                return (
                                    value as (...args: unknown[]) => unknown
                                ).bind(target);
                            }

                            return value;
                        },
                        // Also intercept property definition to ensure verify is always available
                        defineProperty(
                            target: Transporter,
                            prop: string | symbol,
                            descriptor: PropertyDescriptor,
                        ) {
                            // If trying to define verify, use our version
                            if (prop === 'verify') {
                                return Reflect.defineProperty(
                                    target as object,
                                    prop,
                                    {
                                        ...descriptor,
                                        value: verifyMethod,
                                    },
                                );
                            }
                            return Reflect.defineProperty(
                                target as object,
                                prop,
                                descriptor,
                            );
                        },
                    }) as Transporter;

                    // Also directly add verify to the original transport as backup
                    Object.defineProperty(logTransport, 'verify', {
                        value: verifyMethod,
                        writable: true,
                        enumerable: true,
                        configurable: true,
                    });

                    console.log(
                        '[MailModule] Transport wrapped in Proxy with verify() method',
                    );

                    return {
                        transport: proxiedTransport,
                        defaults: {
                            from: `"${process.env.MAIL_FROM_NAME || 'Elvee'}" <${process.env.MAIL_FROM_ADDRESS || 'hello@example.com'}>`,
                        },
                        template: {
                            dir: getTemplateDir(),
                            adapter: new HandlebarsAdapter(),
                            options: {
                                strict: true,
                            },
                        },
                    };
                }

                const mailHost = process.env.MAIL_HOST || '127.0.0.1';
                const mailPort = parseInt(process.env.MAIL_PORT || '2525', 10);
                const mailScheme = process.env.MAIL_SCHEME;
                const mailUsername = process.env.MAIL_USERNAME;
                const mailPassword = process.env.MAIL_PASSWORD;

                return {
                    transport: {
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
                    },
                    defaults: {
                        from: `"${process.env.MAIL_FROM_NAME || 'Elvee'}" <${process.env.MAIL_FROM_ADDRESS || 'hello@example.com'}>`,
                    },
                    template: {
                        dir: getTemplateDir(),
                        adapter: new HandlebarsAdapter(),
                        options: {
                            strict: true,
                        },
                    },
                };
            },
        }),
    ],
    controllers: [MailController],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
