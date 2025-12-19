'use client';

import { useEffect } from 'react';

type HeadProps = {
    title: string;
};

export function Head({ title }: HeadProps) {
    useEffect(() => {
        document.title = title;
    }, [title]);

    return null;
}
