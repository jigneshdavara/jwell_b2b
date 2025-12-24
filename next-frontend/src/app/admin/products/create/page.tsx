'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProductPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the edit page with 'new' as the ID for create mode
        router.replace('/admin/products/new/edit');
    }, [router]);

    // return (
    //     <div className="flex items-center justify-center min-h-screen">
    //         <div className="text-center">
    //             <p className="text-slate-600">Redirecting to product creation page...</p>
    //         </div>
    //     </div>
    // );
}

