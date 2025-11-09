export interface UserKycDocument {
    id: number;
    type: string;
    status: string;
    file_path?: string;
    file_url?: string;
    remarks?: string;
}

export interface UserKycProfile {
    business_name?: string;
    business_website?: string;
    gst_number?: string;
    pan_number?: string;
    registration_number?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    contact_name?: string;
    contact_phone?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    phone?: string;
    type?: string;
    preferred_language?: string;
    credit_limit?: number;
    kyc_status?: string;
    kyc_notes?: string;
    kyc_profile?: UserKycProfile;
    kyc_documents?: UserKycDocument[];
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
