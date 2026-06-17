import Stripe from 'stripe';

export const stripe: InstanceType<typeof Stripe> = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-05-27.dahlia',
});

type CheckoutSession = Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;

export const createCheckoutSession = async ({
    invoiceId,
    publicToken,
    lineItems,
    clientEmail,
    frontendUrl,
} : {
    invoiceId: string
    publicToken: string
    lineItems: { description: string; quantity: unknown; unitPrice: unknown }[];
    clientEmail: string;
    frontendUrl: string;
}) : Promise<CheckoutSession> => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: clientEmail,
        line_items: lineItems.map((item) => ({
            price_data: {
                currency: 'usd',
                product_data: { name: item.description },
                unit_amount: Math.round(Number(item.unitPrice) * 100),
            },
            quantity: Math.round(Number(item.quantity)),
        })),
        mode: 'payment',
        success_url: `${frontendUrl}/pay/${publicToken}/success`,
        cancel_url: `${frontendUrl}/pay/${publicToken}`,
        metadata: { invoiceId, publicToken },
    });

    return session;
};