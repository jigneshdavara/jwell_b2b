import { PrismaService } from '../prisma/prisma.service';

/**
 * Base seeder class that all seeders should extend
 * Similar to Laravel's Seeder class
 */
export abstract class BaseSeeder {
    constructor(protected prisma: PrismaService) {}

    /**
     * Run the database seeds.
     * This method should be implemented by each seeder
     */
    abstract run(): Promise<void>;

    /**
     * Helper method to log seeder execution
     */
    protected log(message: string): void {
        console.log(`[Seeder] ${message}`);
    }
}

