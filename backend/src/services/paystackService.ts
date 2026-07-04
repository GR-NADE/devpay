import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackRequest = async <T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
) : Promise<T> => {
    const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        ...(body && { body: JSON.stringify(body) }),
    });

    const data = await res.json() as { status: boolean; message: string; data: T };

    if (!data.status)
    {
        throw new Error(data.message || 'Paystack request failed');
    }

    return data.data;
};

export interface InitializeTransactionResult {
    authorization_url: string;
    access_code: string;
    reference: string;
}

export const initializeTransaction = async ({
    email,
    amountNGN,
    reference,
    callbackUrl,
    metadata,
    subaccountCode,
} : {
    email: string;
    amountNGN: number;
    reference: string;
    callbackUrl: string;
    metadata: Record<string, string>;
    subaccountCode?: string;
}) : Promise<InitializeTransactionResult> => {
    const amountInKobo = Math.round(amountNGN * 100);

    return paystackRequest<InitializeTransactionResult>('POST', '/transaction/initialize', {
        email,
        amount: amountInKobo,
        currency: 'NGN',
        reference,
        callback_url: callbackUrl,
        metadata,
        ...(subaccountCode && { subaccount: subaccountCode }),
    });
};

export interface VerifyTransactionResult {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata: Record<string, string>;
}

export const verifyTransaction = async (
    reference: string,
) : Promise<VerifyTransactionResult> => {
    return paystackRequest<VerifyTransactionResult>('GET', `/transaction/verify/${reference}`);
};

export const verifyWebhookSignature = (
    rawBody: string,
    signature: string,
) : boolean => {
    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(rawBody)
        .digest('hex');
    return hash === signature;
};

export interface Bank {
    id: number;
    name: string;
    code: string;
}

export const getBanks = async (): Promise<Bank[]> => {
    return paystackRequest<Bank[]>('GET', '/bank?currency=NGN&per_page=100');
};

export interface ResolvedAccount {
    account_number: string;
    account_name: string;
    bank_id: number;
}

export const resolveAccount = async (
    accountNumber: string,
    bankCode: string,
) : Promise<ResolvedAccount> => {
    return paystackRequest<ResolvedAccount>(
        'GET',
        `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    );
};

export interface CreatedSubaccount {
    subaccount_code: string;
    business_name: string;
    account_number: string;
    settlement_bank: string;
}

export const createSubaccount = async ({
    businessName,
    bankCode,
    accountNumber,
} : {
    businessName: string;
    bankCode: string;
    accountNumber: string;
}) : Promise<CreatedSubaccount> => {
    return paystackRequest<CreatedSubaccount>('POST', '/subaccount', {
        business_name: businessName,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: 0,
    });
};