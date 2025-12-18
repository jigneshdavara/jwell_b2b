import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { KycModule } from './kyc/kyc.module';

@Module({
  imports: [AuthModule, PrismaModule, KycModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
