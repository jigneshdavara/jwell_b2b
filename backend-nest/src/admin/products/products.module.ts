import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductVariantsService } from './product-variants/product-variants.service';

@Module({
  providers: [ProductsService, ProductVariantsService],
  controllers: [ProductsController],
  exports: [ProductsService, ProductVariantsService],
})
export class ProductsModule {}
