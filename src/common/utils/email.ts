import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("📧 Dev email account:", testAccount.user);
    console.log("📧 View emails at: https://ethereal.email/login");
  }
  return transporter;
}

const FROM = process.env.SMTP_FROM || "GolfCharity <noreply@golfcharity.com>";
const CLIENT = process.env.CLIENT_URL || "http://localhost:3000";

function wrap(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
body{margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#020617;color:#f1f5f9}
.c{max-width:600px;margin:0 auto;padding:40px 24px}
.hd{text-align:center;margin-bottom:32px}
.logo{display:inline-block;background:#22c55e;color:#020617;font-weight:bold;font-size:18px;padding:12px 20px;border-radius:12px;text-decoration:none}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;margin-bottom:24px}
.btn{display:inline-block;background:#22c55e;color:#020617;font-weight:600;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px}
.ft{text-align:center;color:#64748b;font-size:12px;margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06)}
h1{font-size:24px;margin:0 0 16px}h2{font-size:18px;margin:0 0 12px;color:#22c55e}
p{font-size:14px;line-height:1.6;color:#cbd5e1;margin:0 0 12px}
.hl{color:#22c55e;font-weight:600}
.nums{text-align:center;margin:20px 0}
.ball{display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;background:linear-gradient(135deg,#22c55e,#86efac);color:#020617;font-weight:bold;font-size:18px;border-radius:12px;margin:0 4px}
.st{text-align:center;padding:12px}
.sv{font-size:28px;font-weight:bold;color:#fff}
.sl{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px}
</style></head><body><div class="c"><div class="hd"><a href="${CLIENT}" class="logo">🏌️ GolfCharity</a></div>${content}<div class="ft"><p>© ${new Date().getFullYear()} GolfCharity Platform</p><p>You're receiving this because you have an account on our platform.</p></div></div></body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({ from: FROM, to, subject, html: wrap(html) });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`📧 Preview: ${preview}`);
    console.log(`✉️ Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err);
  }
}

// ═══════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════

export async function sendWelcomeEmail(email: string, firstName: string) {
  await sendEmail(email, "Welcome to GolfCharity! 🏌️", `
    <div class="card">
      <h1>Welcome, ${firstName}! 🎉</h1>
      <p>You've joined a community of golfers who play with purpose.</p>
      <p><span class="hl">Step 1:</span> Enter your 5 latest golf scores (1–45 Stableford)</p>
      <p><span class="hl">Step 2:</span> Choose a charity to support</p>
      <p><span class="hl">Step 3:</span> Enter the monthly draw — match numbers to win!</p>
      <a href="${CLIENT}/dashboard" class="btn">Go to Dashboard →</a>
    </div>`);
}

export async function sendSubscriptionConfirmation(email: string, firstName: string, plan: string, charityName: string, charityPercent: number) {
  await sendEmail(email, "Subscription Confirmed! ✅", `
    <div class="card">
      <h1>You're Subscribed, ${firstName}! 🎊</h1>
      <p>Your <span class="hl">${plan}</span> plan is active.</p>
      <div style="display:flex;gap:16px;margin:20px 0">
        <div class="st" style="flex:1;background:rgba(34,197,94,0.1);border-radius:12px"><div class="sv">${plan}</div><div class="sl">Plan</div></div>
        <div class="st" style="flex:1;background:rgba(244,63,94,0.1);border-radius:12px"><div class="sv">${charityPercent}%</div><div class="sl">To Charity</div></div>
      </div>
      <p>Your chosen charity: <span class="hl">${charityName}</span></p>
      <a href="${CLIENT}/dashboard/scores" class="btn">Enter Your Scores →</a>
    </div>`);
}

export async function sendDrawResultsEmail(email: string, firstName: string, monthYear: string, winningNumbers: number[]) {
  const balls = winningNumbers.map((n) => `<span class="ball">${n}</span>`).join("");
  await sendEmail(email, `${monthYear} Draw Results 🎯`, `
    <div class="card">
      <h1>${monthYear} Draw Results 🎰</h1>
      <p>Hey ${firstName}, the results are in!</p>
      <p style="text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-top:20px">Winning Numbers</p>
      <div class="nums">${balls}</div>
      <p>Log in to see if your scores matched!</p>
      <a href="${CLIENT}/dashboard/draws" class="btn">Check Results →</a>
    </div>`);
}

export async function sendWinnerNotification(email: string, firstName: string, tier: string, amount: number, matchedNumbers: number[]) {
  const tierLabel = tier.replace("_", " ");
  const balls = matchedNumbers.map((n) => `<span class="ball">${n}</span>`).join("");
  await sendEmail(email, `🎉 You Won! (${tierLabel})`, `
    <div class="card" style="border-color:rgba(245,158,11,0.3)">
      <h1>Congratulations, ${firstName}! 🏆</h1>
      <p>You matched in the <span class="hl">${tierLabel}</span> tier!</p>
      <div class="st" style="background:rgba(245,158,11,0.1);border-radius:12px;margin:20px 0"><div class="sv" style="color:#fbbf24">£${(amount / 100).toFixed(2)}</div><div class="sl">Your Prize</div></div>
      <p style="text-align:center;color:#64748b;font-size:12px">Your matched numbers</p>
      <div class="nums">${balls}</div>
      <h2>What's Next?</h2>
      <p>1. Go to <span class="hl">My Winnings</span></p>
      <p>2. Upload a screenshot of your scores as proof</p>
      <p>3. We'll verify and process your payout</p>
      <a href="${CLIENT}/dashboard/winnings" class="btn">Claim Prize →</a>
    </div>`);
}

export async function sendPayoutConfirmation(email: string, firstName: string, amount: number) {
  await sendEmail(email, "Prize Paid! 💰", `
    <div class="card">
      <h1>Payment Sent, ${firstName}! 💰</h1>
      <div class="st" style="background:rgba(34,197,94,0.1);border-radius:12px;margin:20px 0"><div class="sv">£${(amount / 100).toFixed(2)}</div><div class="sl">Amount Paid</div></div>
      <p>Payment should arrive within 3–5 business days.</p>
    </div>`);
}

export async function sendSubscriptionCancelled(email: string, firstName: string, endDate: string) {
  await sendEmail(email, "Subscription Cancelled", `
    <div class="card">
      <h1>We're Sorry to See You Go, ${firstName}</h1>
      <p>Your subscription has been cancelled. Access continues until <span class="hl">${endDate}</span>.</p>
      <p>Changed your mind? Resubscribe anytime.</p>
      <a href="${CLIENT}/#pricing" class="btn">Resubscribe →</a>
    </div>`);
}

export async function sendDrawReminderEmail(email: string, firstName: string, monthYear: string, daysLeft: number) {
  await sendEmail(email, `⏰ ${daysLeft} Days Left — ${monthYear} Draw`, `
    <div class="card">
      <h1>Don't Miss Out, ${firstName}! ⏰</h1>
      <p>The <span class="hl">${monthYear} draw</span> closes in <span class="hl">${daysLeft} days</span>.</p>
      <p>Make sure your scores are up to date and you've entered.</p>
      <a href="${CLIENT}/dashboard/draws" class="btn">Enter Now →</a>
    </div>`);
}