import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor to convert FormData fields to JSON objects/arrays
 * This runs BEFORE validation, so DTOs receive proper JSON objects
 * instead of JSON strings.
 *
 * Handles:
 * - JSON strings in FormData fields (variants, media, etc.)
 * - Nested JSON strings (metals, diamonds within variants)
 * - Type conversions (strings to numbers, booleans)
 */
@Injectable()
export class FormDataToJsonInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<{
            body: unknown;
        }>();

        const body = request.body;

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return next.handle();
        }

        // Convert FormData to JSON
        const jsonBody = this.convertFormDataToJson(body as Record<string, unknown>);

        // Replace request body with converted JSON
        request.body = jsonBody;

        console.log('[FormDataToJsonInterceptor] Converted FormData to JSON:', {
            hasVariants: !!jsonBody.variants,
            variantsType: typeof jsonBody.variants,
            variantsIsArray: Array.isArray(jsonBody.variants),
        });

        return next.handle();
    }

    /**
     * Recursively convert FormData values to JSON
     */
    private convertFormDataToJson(
        data: Record<string, unknown>,
    ): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data)) {
            result[key] = this.convertValue(value);
        }

        return result;
    }

    /**
     * Convert a single value from FormData format to JSON
     */
    private convertValue(value: unknown): unknown {
        // Handle null/undefined
        if (value === null || value === undefined) {
            return value;
        }

        // Handle strings (most common in FormData)
        if (typeof value === 'string') {
            const trimmed = value.trim();

            // Empty string
            if (trimmed === '') {
                return null;
            }

            // Try to parse as JSON (arrays or objects)
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try {
                    const parsed = JSON.parse(trimmed) as unknown;
                    // Recursively convert nested values
                    return this.convertValue(parsed);
                } catch {
                    // If JSON parsing fails, continue with other conversions
                }
            }

            // Try to parse as boolean
            if (trimmed === 'true' || trimmed === 'false') {
                return trimmed === 'true';
            }

            // Try to parse as number
            const numValue = Number(trimmed);
            if (
                !isNaN(numValue) &&
                isFinite(numValue) &&
                trimmed !== '' &&
                /^-?\d+(\.\d+)?$/.test(trimmed)
            ) {
                return numValue;
            }

            // Return as string if no conversion applies
            return value;
        }

        // Handle arrays - convert each element
        if (Array.isArray(value)) {
            return value.map((item) => this.convertValue(item));
        }

        // Handle objects - recursively convert
        if (typeof value === 'object' && value !== null) {
            // Check if it's an object with numeric keys (FormData array format)
            const obj = value as Record<string, unknown>;
            const keys = Object.keys(obj);
            const hasNumericKeys =
                keys.length > 0 && keys.every((key) => /^\d+$/.test(key));

            if (hasNumericKeys) {
                // Convert object with numeric keys to array
                return keys
                    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                    .map((key) => this.convertValue(obj[key]));
            }

            // Regular object - recursively convert
            return this.convertFormDataToJson(obj);
        }

        // Return as-is for other types
        return value;
    }
}

