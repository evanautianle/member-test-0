import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  const payload = await getPayload({ config: payloadConfig });

  //  Annual subscription payment success
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;

    let email = invoice.customer_email;

    // Fallback if needed
    if (!email && invoice.customer) {
      const customer = await stripe.customers.retrieve(
        invoice.customer as string
      );

      if (typeof customer === 'object' && 'email' in customer) {
        email = customer.email || undefined;
      }
    }

    if (!email) return NextResponse.json({ received: true });

    email = email.toLowerCase().trim(); // 🔥 VERY IMPORTANT

    await payload.update({
      collection: 'members',
      where: { email: { equals: email } },
      data: { payment_status: 'paid' },
      overrideAccess: true,
    });
  }

  return NextResponse.json({ received: true });
}