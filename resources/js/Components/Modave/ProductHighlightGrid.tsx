import ProductCard, { ProductCardProps } from './ProductCard';
import SectionHeading from './SectionHeading';

type ProductHighlightGridProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    products: ProductCardProps[];
    columns?: 2 | 3 | 4;
    alignHeading?: 'left' | 'center';
};

export default function ProductHighlightGrid({
    eyebrow,
    title,
    description,
    products,
    columns = 4,
    alignHeading = 'left',
}: ProductHighlightGridProps) {
    const gridCols =
        columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';

    return (
        <section className="space-y-10">
            <SectionHeading eyebrow={eyebrow} title={title} description={description} align={alignHeading} />
            <div className={`grid gap-6 ${gridCols}`}>
                {products.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>
        </section>
    );
}

