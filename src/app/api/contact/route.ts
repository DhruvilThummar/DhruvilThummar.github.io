import { NextResponse } from 'next/server';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json(
        { error: 'Message is required and must be at least 5 characters' },
        { status: 400 }
      );
    }

    // Check if Resend API Key is available in environment
    const resendApiKey = process.env.RESEND_API_KEY;
    const contactFrom = process.env.CONTACT_FROM || 'onboarding@resend.dev';
    const contactTo = process.env.CONTACT_TO || 'dhruvilthummar1303@gmail.com';

    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: contactFrom,
            to: [contactTo],
            reply_to: email.trim(),
            subject: subject || `New Portfolio Contact from ${name.trim()}`,
            html: `
              <h2>New Portfolio Inquiry</h2>
              <p><strong>Name:</strong> ${name.trim()}</p>
              <p><strong>Email:</strong> ${email.trim()}</p>
              <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
              <hr />
              <p><strong>Message:</strong></p>
              <p>${message.trim().replace(/\n/g, '<br>')}</p>
            `,
          }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          console.warn('[Resend API Error]:', errText);
        }
      } catch (emailError) {
        console.warn('[Email Dispatch Error]:', emailError);
      }
    } else {
      console.log('[Contact Form Submission Received] (No RESEND_API_KEY set):', {
        name,
        email,
        subject,
        message,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: true, message: 'Your message has been received successfully!' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[API /api/contact Error]:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
