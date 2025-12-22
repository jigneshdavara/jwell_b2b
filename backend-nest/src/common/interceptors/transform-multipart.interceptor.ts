import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor to transform multipart/form-data request body
 * Converts string values to appropriate types (numbers, booleans, arrays, objects)
 * before validation
 */
@Injectable()
export class TransformMultipartInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<{
            body: unknown;
        }>();
        const body: unknown = request.body;

        console.log('[TransformMultipartInterceptor] Called', {
            hasBody: !!body,
            bodyType: typeof body,
            isArray: Array.isArray(body),
            isObject: body && typeof body === 'object',
        });

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            console.log(
                '[TransformMultipartInterceptor] Skipping - invalid body',
            );
            return next.handle();
        }

        // Log before transformation
        const sample = body as Record<string, unknown>;
        console.log('[TransformMultipartInterceptor] Before:', {
            brand_id: sample.brand_id,
            category_id: sample.category_id,
            category_ids: sample.category_ids,
            style_ids: sample.style_ids,
            making_charge_types: sample.making_charge_types,
            is_active: sample.is_active,
            metadata: sample.metadata,
        });

        // Transform the body
        const transformedBody = this.transformValue(body);

        // Log after transformation
        const transformedSample = transformedBody as Record<string, unknown>;
        console.log('[TransformMultipartInterceptor] After:', {
            brand_id: transformedSample.brand_id,
            category_id: transformedSample.category_id,
            category_ids: transformedSample.category_ids,
            style_ids: transformedSample.style_ids,
            making_charge_types: transformedSample.making_charge_types,
            is_active: transformedSample.is_active,
            metadata: transformedSample.metadata,
        });

        // Replace the request body with transformed values
        request.body = transformedBody;

        return next.handle();
    }

    private transformValue(value: unknown): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        // If it's an array, transform each element
        if (Array.isArray(value)) {
            return value.map((item) => this.transformValue(item));
        }

        // If it's an object, transform each property
        if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
        ) {
            const transformed: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(value)) {
                transformed[key] = this.transformValue(val);
            }
            return transformed;
        }

        // If it's a string, try to parse it
        if (typeof value === 'string') {
            const trimmed = value.trim();

            // Handle empty string
            if (trimmed === '') {
                return null;
            }

            // Try to parse as JSON (for arrays and objects)
            // Check if it looks like JSON (starts with [ or {)
            if (
                (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
                (trimmed.startsWith('{') && trimmed.endsWith('}'))
            ) {
                try {
                    const parsed = JSON.parse(trimmed) as unknown;
                    return this.transformValue(parsed); // Recursively transform parsed value
                } catch {
                    // If JSON parsing fails, continue with other transformations
                }
            }

            // Try to parse as boolean (exact match)
            if (trimmed === 'true' || trimmed === 'false') {
                return trimmed === 'true';
            }

            // Try to parse as number
            // Check if it's a valid numeric string (including decimals and negative numbers)
            const numValue = Number(trimmed);
            if (!isNaN(numValue) && isFinite(numValue) && trimmed !== '') {
                // Additional check: ensure the string represents a number
                // This prevents converting strings like "123abc" to 123
                if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
                    return numValue;
                }
            }
        }

        // Return as-is if no transformation needed
        return value;
    }
}
