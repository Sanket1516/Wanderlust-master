// Shared wrapper for all email templates
function wrap(content) {
    return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#fe424d,#e0353e);padding:24px 32px;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Wanderlust</h1>
        </div>
        <div style="padding:32px;">
            ${content}
        </div>
        <div style="background:#f8f9fa;padding:16px 32px;text-align:center;font-size:12px;color:#888;">
            &copy; Wanderlust &mdash; Your next adventure awaits
        </div>
    </div>`;
}

module.exports.welcomeEmail = (username) => {
    return wrap(`
        <h2 style="color:#333;margin-top:0;">Welcome to Wanderlust, ${username}!</h2>
        <p style="color:#555;line-height:1.6;">
            Your account has been created successfully. You can now browse amazing stays,
            save your favourites to your wishlist, book trips, and even list your own property.
        </p>
        <p style="color:#555;line-height:1.6;">Happy travels!</p>
    `);
};

module.exports.bookingConfirmation = ({ listingTitle, checkIn, checkOut, totalNights, totalPrice }) => {
    return wrap(`
        <h2 style="color:#333;margin-top:0;">Booking Confirmed!</h2>
        <p style="color:#555;line-height:1.6;">Your reservation has been successfully processed.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Property</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-weight:600;text-align:right;">${listingTitle}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Check-in</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;text-align:right;">${checkIn}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Check-out</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;text-align:right;">${checkOut}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Duration</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;text-align:right;">${totalNights} night${totalNights > 1 ? "s" : ""}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;color:#888;">Total Paid</td>
                <td style="padding:10px 0;color:#fe424d;font-weight:700;font-size:18px;text-align:right;">&#8377; ${Number(totalPrice).toLocaleString("en-IN")}</td>
            </tr>
        </table>
        <p style="color:#555;line-height:1.6;">You can view your bookings anytime from your profile. Enjoy your stay!</p>
    `);
};

module.exports.newBookingAlert = ({ guestName, listingTitle, checkIn, checkOut, totalNights, totalPrice }) => {
    return wrap(`
        <h2 style="color:#333;margin-top:0;">New Booking Received!</h2>
        <p style="color:#555;line-height:1.6;">
            <strong>${guestName}</strong> has booked your listing <strong>${listingTitle}</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Guest</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-weight:600;text-align:right;">${guestName}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Check-in</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;text-align:right;">${checkIn}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Check-out</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;text-align:right;">${checkOut}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Duration</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;text-align:right;">${totalNights} night${totalNights > 1 ? "s" : ""}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;color:#888;">Revenue</td>
                <td style="padding:10px 0;color:#fe424d;font-weight:700;font-size:18px;text-align:right;">&#8377; ${Number(totalPrice).toLocaleString("en-IN")}</td>
            </tr>
        </table>
    `);
};

module.exports.bookingCancellation = ({ listingTitle, checkIn, checkOut, cancelledBy }) => {
    return wrap(`
        <h2 style="color:#333;margin-top:0;">Booking Cancelled</h2>
        <p style="color:#555;line-height:1.6;">
            A booking for <strong>${listingTitle}</strong> has been cancelled by the ${cancelledBy}.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Property</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;font-weight:600;text-align:right;">${listingTitle}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Check-in</td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;color:#333;text-align:right;">${checkIn}</td>
            </tr>
            <tr>
                <td style="padding:10px 0;color:#888;">Check-out</td>
                <td style="padding:10px 0;color:#333;text-align:right;">${checkOut}</td>
            </tr>
        </table>
        <p style="color:#555;line-height:1.6;">If you have any questions, please contact us.</p>
    `);
};

module.exports.newMessageNotification = ({ senderName, listingTitle, messagePreview }) => {
    return wrap(`
        <h2 style="color:#333;margin-top:0;">New Message</h2>
        <p style="color:#555;line-height:1.6;">
            <strong>${senderName}</strong> sent you a message about <strong>${listingTitle}</strong>:
        </p>
        <div style="background:#f8f9fa;border-left:4px solid #fe424d;padding:16px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="color:#333;margin:0;font-style:italic;">"${messagePreview}"</p>
        </div>
        <p style="color:#555;line-height:1.6;">Log in to Wanderlust to reply.</p>
    `);
};
