'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: string;
    placeholder?: string;
    toolbar?: any;
};

declare global {
    interface Window {
        CKEDITOR: any;
    }
}

const CKEDITOR_SRC = 'https://cdn.ckeditor.com/4.22.1/full-all/ckeditor.js';

export default function RichTextEditor({
    value,
    onChange,
    onBlur,
    className,
    placeholder,
    toolbar,
}: RichTextEditorProps) {
    const latestValue = useRef(value ?? '');
    const editorInstance = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        latestValue.current = value ?? '';
        if (editorInstance.current && editorInstance.current.getData() !== (value ?? '')) {
            editorInstance.current.setData(value ?? '');
        }
    }, [value]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (window.CKEDITOR) {
            setIsReady(true);
            return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>('script[data-ckeditor="4"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => setIsReady(true), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = CKEDITOR_SRC;
        script.async = true;
        script.dataset.ckeditor = '4';
        script.onload = () => setIsReady(true);
        document.head.appendChild(script);
    }, []);

    const config = useMemo(() => {
        return {
            toolbar:
                toolbar ??
                [
                    { name: 'document', items: ['Source', '-', 'Preview', 'Print', '-', 'Templates'] },
                    {
                        name: 'clipboard',
                        items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
                    },
                    {
                        name: 'editing',
                        items: ['Find', 'Replace', '-', 'SelectAll', '-', 'Scayt'],
                    },
                    '/',
                    {
                        name: 'basicstyles',
                        items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'],
                    },
                    {
                        name: 'paragraph',
                        items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv'],
                    },
                    { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
                    {
                        name: 'insert',
                        items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar'],
                    },
                    '/',
                    { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
                    { name: 'colors', items: ['TextColor', 'BGColor'] },
                    { name: 'tools', items: ['Maximize'] },
                ],
            removePlugins: 'elementspath,about,cloudservices,easyimage,exportpdf',
            height: 320,
            allowedContent: true,
            toolbarCanCollapse: false,
        };
    }, [toolbar]);

    const initializeEditor = useCallback(() => {
        if (!window.CKEDITOR || !textareaRef.current) {
            return;
        }

        window.CKEDITOR.config.autoParagraph = false;
        window.CKEDITOR.config.versionCheck = false;

        const instance = window.CKEDITOR.replace(textareaRef.current, {
            ...config,
            placeholder,
        });

        editorInstance.current = instance;

        instance.on('change', () => {
            const data = instance.getData();
            latestValue.current = data;
            onChange(data);
        });

        instance.on('blur', () => {
            onBlur?.(instance.getData());
        });

        instance.on('instanceReady', () => {
            if (latestValue.current && instance.getData() !== latestValue.current) {
                instance.setData(latestValue.current);
            }
        });
    }, [config, onBlur, onChange, placeholder]);

    useEffect(() => {
        if (!isReady) {
            return;
        }

        initializeEditor();

        return () => {
            if (editorInstance.current) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, [initializeEditor, isReady]);

    return (
        <div className={className}>
            <textarea ref={textareaRef} defaultValue={value ?? ''} />
        </div>
    );
}

