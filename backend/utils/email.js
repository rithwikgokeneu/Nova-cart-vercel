const nodemailer = require('nodemailer');

const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  await transporter.sendMail({ from: `"Nova Cart" <${process.env.EMAIL_USER}>`, to, subject, html });
};

const sendOrderConfirmationEmail = async (email, name, order) => {
  const itemsHtml = order.items.map(item =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.title}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
      <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#1a3c34;letter-spacing:-0.5px">NOVA<span style="color:#2176ae">CART</span></h2>
      <h2 style="color:#1a3c34">Order Confirmed!</h2>
      <p style="color:#555">Hi ${name}, thank you for your order. Here's your summary:</p>
      <p style="color:#888;font-size:13px">Order ID: <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#f5f5f5">
          <th style="padding:8px;text-align:left">Item</th>
          <th style="padding:8px;text-align:center">Qty</th>
          <th style="padding:8px;text-align:right">Price</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${order.discountAmount > 0 ? `<p style="color:green;font-size:13px">Coupon discount: -$${order.discountAmount.toFixed(2)}</p>` : ''}
      <p style="font-size:16px;font-weight:bold;color:#1a3c34">Total: $${order.totalAmount.toFixed(2)}</p>
      <p style="color:#555">Shipping to: ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country}</p>
      <p style="color:#999;font-size:12px;margin-top:24px">Thank you for shopping with Nova Cart!</p>
    </div>`;

  await sendEmail({ to: email, subject: `Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()}`, html });
};

const sendCancellationRequestEmail = async (vendorEmail, vendorName, order, customerName) => {
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
      <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#1a3c34">NOVA<span style="color:#2176ae">CART</span></h2>
      <h3 style="color:#b91c1c">Cancellation Request Received</h3>
      <p style="color:#555">Hi ${vendorName}, a customer has requested to cancel an order containing your product(s).</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 6px;color:#555;font-size:13px"><strong>Order:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
        <p style="margin:0 0 6px;color:#555;font-size:13px"><strong>Customer:</strong> ${customerName}</p>
        <p style="margin:0 0 6px;color:#555;font-size:13px"><strong>Order Total:</strong> $${order.totalAmount.toFixed(2)}</p>
        <p style="margin:0;color:#555;font-size:13px"><strong>Reason:</strong> ${order.cancellationRequest?.reason || 'Not provided'}</p>
      </div>
      <p style="color:#555">Please log in to your Vendor Dashboard to approve or reject this request. If approved, the customer will receive gift points worth the full order amount.</p>
      <p style="color:#999;font-size:12px;margin-top:24px">Nova Cart Vendor Notifications</p>
    </div>`;
  await sendEmail({ to: vendorEmail, subject: `Action Required: Cancellation Request — Order #${order._id.toString().slice(-8).toUpperCase()}`, html });
};

const sendCancellationApprovedEmail = async (customerEmail, customerName, order, pointsAdded) => {
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
      <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#1a3c34">NOVA<span style="color:#2176ae">CART</span></h2>
      <h3 style="color:#15803d">Your Cancellation was Approved</h3>
      <p style="color:#555">Hi ${customerName}, your cancellation request for order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> has been approved.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
        <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#15803d">🎁 ${pointsAdded} Gift Points</p>
        <p style="margin:0;color:#16a34a;font-size:14px">worth $${pointsAdded.toFixed(2)} added to your account</p>
      </div>
      <p style="color:#555">You can use your gift points at checkout for your next purchase. Points never expire.</p>
      <p style="color:#999;font-size:12px;margin-top:24px">Thank you for shopping with Nova Cart!</p>
    </div>`;
  await sendEmail({ to: customerEmail, subject: `Cancellation Approved — ${pointsAdded} Gift Points Added`, html });
};

const sendCancellationRejectedEmail = async (customerEmail, customerName, order) => {
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
      <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#1a3c34">NOVA<span style="color:#2176ae">CART</span></h2>
      <h3 style="color:#b45309">Cancellation Request Update</h3>
      <p style="color:#555">Hi ${customerName}, unfortunately your cancellation request for order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> could not be approved at this time.</p>
      <p style="color:#555">Your order is still being processed. If you have further questions, please contact our support team at <a href="mailto:support@novacart.com" style="color:#2176ae">support@novacart.com</a>.</p>
      <p style="color:#999;font-size:12px;margin-top:24px">Thank you for shopping with Nova Cart!</p>
    </div>`;
  await sendEmail({ to: customerEmail, subject: `Cancellation Request Update — Order #${order._id.toString().slice(-8).toUpperCase()}`, html });
};

module.exports = { sendEmail, sendOrderConfirmationEmail, sendCancellationRequestEmail, sendCancellationApprovedEmail, sendCancellationRejectedEmail };
