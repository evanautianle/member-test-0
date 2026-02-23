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
      process.env.STRIPE_WEBHOOK_SECRET! // get this from Stripe dashboard
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  const payload = await getPayload({ config: payloadConfig });

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    let email = session.customer_email;
    // Fallback to customer_details.email if customer_email is not set
    if (!email && session.customer_details && session.customer_details.email) {
      email = session.customer_details.email;
    }
    console.log('[Stripe webhook] checkout.session.completed, email:', email);
    if (!email) return NextResponse.json({ ok: true });
    const result = await payload.update({
      collection: 'members',
      where: { email: { equals: email } },
      data: { payment_status: 'paid' },
      depth: 0,
      req,
      overrideAccess: false,
    });
    if (result.docs?.length === 0) {
      console.warn('[Stripe webhook] No member found for email:', email);
    } else {
      console.log('[Stripe webhook] Updated member(s) for email:', email);
    }
  }

  // Handle payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    let email = paymentIntent.metadata?.email;
    // If email is not in metadata, try to fetch from customer object
    if (!email && paymentIntent.customer) {
      try {
        const customer = await stripe.customers.retrieve(paymentIntent.customer as string);
        if (typeof customer === 'object' && customer && 'email' in customer) {
          email = (customer as Stripe.Customer).email || undefined;
        }
      } catch (err) {
        console.error('[Stripe webhook] Failed to fetch customer for payment_intent:', err);
      }
    }
    console.log('[Stripe webhook] payment_intent.succeeded, email:', email);
    if (!email) return NextResponse.json({ ok: true });
    const result = await payload.update({
      collection: 'members',
      where: { email: { equals: email } },
      data: { payment_status: 'paid' },
      depth: 0,
      req,
      overrideAccess: false,
    });
    if (result.docs?.length === 0) {
      console.warn('[Stripe webhook] No member found for email:', email);
    } else {
      console.log('[Stripe webhook] Updated member(s) for email:', email);
    }
  }

  return NextResponse.json({ received: true });
}