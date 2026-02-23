/**
 * Stripe Webhook API Route
 * ------------------------
 * Handles Stripe payment confirmation events.
 * 1. Receives webhook from Stripe after payment.
 * 2. Verifies Stripe signature and parses event.
 * 3. On payment success, updates member's payment_status to 'paid' in MongoDB (Payload).
 * 4. Responds to Stripe with confirmation.
 *
 * This route is called AFTER payment. Signup and payment initiation are handled by the signup route.
 */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  // Read raw webhook body and Stripe signature
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  // Verify Stripe webhook signature and parse event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    // Invalid signature or event
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  // Get Payload instance for database operations
  const payload = await getPayload({ config: payloadConfig });

  // Handle payment success event
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;

    let email = invoice.customer_email;

    // Fallback: retrieve customer email if not present
    if (!email && invoice.customer) {
      const customer = await stripe.customers.retrieve(
        invoice.customer as string
      );

      if (typeof customer === 'object' && 'email' in customer) {
        email = customer.email || undefined;
      }
    }

    if (!email) return NextResponse.json({ received: true });

    email = email.toLowerCase().trim(); // Normalize email

    // Update member's payment_status to 'paid' in MongoDB
    await payload.update({
      collection: 'members',
      where: { email: { equals: email } },
      data: { payment_status: 'paid' },
      overrideAccess: true,
    });
  }

  // Respond to Stripe webhook
  return NextResponse.json({ received: true });
}