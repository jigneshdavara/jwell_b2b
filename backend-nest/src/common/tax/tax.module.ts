import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [TaxService],
    exports: [TaxService],
})
export class TaxModule {}
