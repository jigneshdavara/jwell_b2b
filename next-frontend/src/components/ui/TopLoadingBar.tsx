'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function TopLoadingBar() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Start loading when pathname changes
        setLoading(true);
        setProgress(20);
        progressRef.current = 20;

        // Clear any existing intervals/timeouts
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Simulate progress with increasing intervals (slower as it progresses)
        intervalRef.current = setInterval(() => {
            setProgress((prev) => {
                let next = prev;
                if (prev < 50) {
                    next = prev + 15; // Fast initial progress
                } else if (prev < 80) {
                    next = prev + 8; // Medium progress
                } else if (prev < 95) {
                    next = prev + 3; // Slow progress near completion
                } else {
                    next = 95; // Cap at 95% until page loads
                }
                progressRef.current = next;
                return next;
            });
        }, 100);

        // Complete loading after navigation
        timeoutRef.current = setTimeout(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            setProgress(100);
            progressRef.current = 100;
            
            // Hide after completion animation
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
                progressRef.current = 0;
            }, 300);
        }, 500);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [pathname]);

    // Also listen to link clicks for immediate feedback
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a[href]');
            
            if (link) {
                const href = link.getAttribute('href');
                // Only show loading for internal links (not external or same page)
                if (href && href.startsWith('/') && href !== pathname) {
                    setLoading(true);
                    setProgress(10);
                    progressRef.current = 10;
                }
            }
        };

        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [pathname]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[10000] h-1 bg-transparent pointer-events-none">
            <div
                className="h-full bg-gradient-to-r from-elvee-blue via-feather-gold to-elvee-blue transition-all duration-200 ease-out shadow-lg shadow-elvee-blue/50"
                style={{
                    width: `${progress}%`,
                    transition: 'width 0.2s ease-out',
                }}
            />
        </div>
    );
}

