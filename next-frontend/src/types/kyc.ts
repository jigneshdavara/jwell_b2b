/**
 * KYC-related types
 */

export type KycDocument = {
    id: number | string;
    type: string;
    status: string;
    remarks?: string | null;
    file_path?: string | null;
    url?: string | null;
    download_url?: string | null;
    created_at?: string | null;
    uploaded_at?: string | null;
};

export type KycProfile = {
    business_name?: string;
    business_website?: string | null;
    gst_number?: string | null;
    pan_number?: string | null;
    registration_number?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
};

export type ConversationMessage = {
    id: number | string;
    sender_type: 'admin' | 'customer';
    message: string;
    created_at?: string | null;
    users?: {
        id: number;
        name: string;
    } | null;
};

export type KycUser = {
    id: number | string;
    name: string;
    email: string;
    phone?: string | null;
    type?: string | null;
    kyc_status: string;
    kyc_notes?: string | null;
    kyc_comments_enabled?: boolean;
};

