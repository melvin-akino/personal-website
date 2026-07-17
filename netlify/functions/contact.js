exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { name, email, company, service, details, budget, timeline } = JSON.parse(event.body || '{}');

    if (!name || !email || !details) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Name, email and project details are required.' }),
      };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [process.env.CONTACT_TO || 'akino.melvin@gmail.com'],
        reply_to: email,
        subject: `New inquiry from ${name}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 32px 36px; }
    .header h1 { margin: 0; font-size: 20px; color: #fff; letter-spacing: -0.02em; }
    .header p  { margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,0.45); font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.05em; text-transform: uppercase; }
    .body { padding: 32px 36px; }
    .row { margin-bottom: 20px; }
    .label { font-size: 11px; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 4px; }
    .value { font-size: 15px; color: #0f172a; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 15px; color: #0f172a; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .footer { border-top: 1px solid #e2e8f0; padding: 20px 36px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>New inquiry received</h1>
      <p>via vinaquino.dev · contact form</p>
    </div>
    <div class="body">
      <div class="grid">
        <div class="row">
          <div class="label">Name</div>
          <div class="value">${escHtml(name)}</div>
        </div>
        <div class="row">
          <div class="label">Email</div>
          <div class="value">${escHtml(email)}</div>
        </div>
      </div>
      ${company ? `
      <div class="row">
        <div class="label">Company</div>
        <div class="value">${escHtml(company)}</div>
      </div>` : ''}
      <div class="grid">
        ${service ? `<div class="row"><div class="label">Service needed</div><div class="value">${escHtml(service)}</div></div>` : ''}
        ${budget  ? `<div class="row"><div class="label">Budget</div><div class="value">${escHtml(budget)}</div></div>`  : ''}
      </div>
      ${timeline ? `
      <div class="row">
        <div class="label">Timeline</div>
        <div class="value">${escHtml(timeline)}</div>
      </div>` : ''}
      <div class="row">
        <div class="label">Project details</div>
        <div class="details-box">${escHtml(details).replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="footer">Reply directly to this email to respond to ${escHtml(name)}.</div>
  </div>
</body>
</html>`,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Resend error:', payload);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: payload.message || 'Failed to send email.' }),
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error — please try again or email directly.' }),
    };
  }
};

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
