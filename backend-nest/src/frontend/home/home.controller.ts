import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeResponseDto } from './dto/home.dto';

@Controller('home')
export class HomeController {
    constructor(private homeService: HomeService) {}

    @Get()
    async index(): Promise<HomeResponseDto> {
        return await this.homeService.getHomeData();
    }
}
