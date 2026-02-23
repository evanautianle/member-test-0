/**
 * Signup API Route
 * -----------------
 * Handles member signup and payment initiation.
 * 1. Receives signup form data (name, email, student_id).
 * 2. Checks if member exists in MongoDB (Payload).
 * 3. Creates member with 'pending' payment status if not found.
 * 4. Creates Stripe Checkout Session for payment.
 * 5. Returns Stripe session URL for frontend redirect.
 *
 * This route is called BEFORE payment. Payment confirmation is handled by the Stripe webhook route.
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
  // Parse signup form data from request
  const body = await req.json();

  const name = body.name;
  const email = body.email.toLowerCase().trim(); // Normalize email
  const student_id = body.student_id;

  // Get Payload instance for database operations
  const payload = await getPayload({ config: payloadConfig });

  // 1️⃣ Check if member already exists in MongoDB
  const existing = await payload.find({
    collection: 'members',
    where: { email: { equals: email } },
  });

  if (existing.docs.length === 0) {
    // 2️⃣ Create member if not exists, set payment_status to 'pending'
    await payload.create({
      collection: 'members',
      data: {
        name,
        email,
        student_id,
        payment_status: 'pending',
      },
    });
  }

  // 3️⃣ Create Stripe Checkout Session for payment
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/signup`,
  });

  // Return Stripe session URL to frontend
  return NextResponse.json({ url: session.url });
}