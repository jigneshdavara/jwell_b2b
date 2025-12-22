import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Pipe to transform multipart/form-data request body
 * Converts string values to appropriate types (numbers, booleans, arrays, objects)
 * This runs BEFORE ValidationPipe, so validation receives properly typed data
 */
@Injectable()
export class TransformMultipartPipe implements PipeTransform {
    transform(value: unknown, metadata: ArgumentMetadata): unknown {
        // Always log to see if pipe is being called
        console.log('[TransformMultipartPipe] Called', {
            type: metadata.type,
            dataType: typeof value,
            isArray: Array.isArray(value),
            isObject: value && typeof value === 'object',
        });

        // Only transform body data (not query params, etc.)
        if (metadata.type !== 'body') {
            console.log('[TransformMultipartPipe] Skipping - not body type');
            return value;
        }

        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            console.log(
                '[TransformMultipartPipe] Skipping - invalid value type',
            );
            return value;
        }

        // Log sample values before transformation
        const sample = value as Record<string, unknown>;
        console.log('[TransformMultipartPipe] Before transformation:', {
            brand_id: sample.brand_id,
            category_id: sample.category_id,
            category_ids: sample.category_ids,
            style_ids: sample.style_ids,
            making_charge_types: sample.making_charge_types,
            is_active: sample.is_active,
            metadata: sample.metadata,
            variants: Array.isArray(sample.variants)
                ? `Array(${sample.variants.length})`
                : sample.variants,
        });

        // Transform the entire body object
        const transformed = this.transformValue(value);

        // Log sample values after transformation
        const transformedSample = transformed as Record<string, unknown>;
        console.log('[TransformMultipartPipe] After transformation:', {
            brand_id: transformedSample.brand_id,
            category_id: transformedSample.category_id,
            category_ids: transformedSample.category_ids,
            style_ids: transformedSample.style_ids,
            making_charge_types: transformedSample.making_charge_types,
            is_active: transformedSample.is_active,
            metadata: transformedSample.metadata,
            variants: Array.isArray(transformedSample.variants)
                ? `Array(${transformedSample.variants.length})`
                : transformedSample.variants,
        });

        return transformed;
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
