'use client';

import { useState } from 'react';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch('/api/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        student_id: formData.get('student_id'),
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url; // Redirect to Stripe
    }

    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 500, margin: '80px auto' }}>
      <h1>Membership Signup</h1>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full Name" required />
        <br /><br />

        <input name="email" type="email" placeholder="Email" required />
        <br /><br />

        <input name="student_id" placeholder="Student ID" required />
        <br /><br />

        <button disabled={loading}>
          {loading ? 'Processing...' : 'Continue to Payment'}
        </button>
      </form>
    </div>
  );
}