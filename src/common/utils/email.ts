import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "GolfCharity <onboarding@resend.dev>";
const CLIENT = process.env.CLIENT_URL || "http://localhost:3000";

// ── Send Email Helper ──
async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Dev mode: log instead of sending if no API key
    if (!process.env.RESEND_API_KEY) {
      console.log(`📧 [DEV] Email to ${to}: ${subject}`);
      return;
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: wrap(html),
    });

    if (error) {
      console.error(`❌ Email failed to ${to}:`, error);
    } else {
      console.log(`✉️ Sent to ${to}: ${subject} (id: ${data?.id})`);
    }
  } catch (err) {
    console.error(`❌ Email error:`, err);
  }
}

// ── Base Template ──
function wrap(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#020617;color:#f1f5f9}
.c{max-width:600px;margin:0 auto;padding:40px 24px}
.hd{text-align:center;margin-bottom:32px}
.logo{display:inline-block;background:#22c55e;color:#020617;font-weight:bold;font-size:18px;padding:12px 20px;border-radius:12px;text-decoration:none}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;margin-bottom:24px}
.btn{display:inline-block;background:#22c55e;color:#020617!important;font-weight:600;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:16px}
.ft{text-align:center;color:#64748b;font-size:12px;margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06)}
h1{font-size:24px;margin:0 0 16px;color:#f1f5f9}
h2{font-size:18px;margin:0 0 12px;color:#22c55e}
p{font-size:14px;line-height:1.6;color:#cbd5e1;margin:0 0 12px}
.hl{color:#22c55e;font-weight:600}
.ball{display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;background:linear-gradient(135deg,#22c55e,#86efac);color:#020617;font-weight:bold;font-size:18px;border-radius:12px;margin:0 4px}
.sv{font-size:28px;font-weight:bold;color:#fff}
.sl{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.st{text-align:center;padding:16px;border-radius:12px;margin:16px 0}
</style></head><body><div class="c">
<div class="hd"><a href="${CLIENT}" class="logo">🏌️ GolfCharity</a></div>
${content}
<div class="ft"><p>© ${new Date().getFullYear()} GolfCharity Platform</p></div>
</div></body></html>`;
}

// ═══════════════════════════════════════════
// All redirect links point to frontend pages
// ═══════════════════════════════════════════

export async function sendWelcomeEmail(email: string, firstName: string) {
  const dashboardUrl = `${CLIENT}/dashboard`;
  const scoresUrl = `${CLIENT}/dashboard/scores`;
  const charitiesUrl = `${CLIENT}/dashboard/onboarding`;

  await sendEmail(email, "Welcome to GolfCharity! 🏌️", `
    <div class="card">
      <h1>Welcome, ${firstName}! 🎉</h1>
      <p>You've joined a community of golfers who play with purpose.</p>
      <p><span class="hl">Step 1:</span> <a href="${charitiesUrl}" style="color:#22c55e">Choose a charity</a> to support</p>
      <p><span class="hl">Step 2:</span> <a href="${scoresUrl}" style="color:#22c55e">Enter your 5 golf scores</a> (1–45 Stableford)</p>
      <p><span class="hl">Step 3:</span> Enter the monthly draw — match numbers to win!</p>
      <div style="text-align:center"><a href="${charitiesUrl}" class="btn">Choose Your Charity →</a></div>
    </div>`);
}

export async function sendSubscriptionConfirmation(
  email: string, firstName: string, plan: string,
  charityName: string, charityPercent: number
) {
  const scoresUrl = `${CLIENT}/dashboard/scores`;

  await sendEmail(email, "Subscription Confirmed! ✅", `
    <div class="card">
      <h1>You're Subscribed, ${firstName}! 🎊</h1>
      <p>Your <span class="hl">${plan}</span> plan is now active.</p>
      <table width="100%" cellpadding="0" cellspacing="8" style="margin:20px 0">
        <tr>
          <td class="st" style="background:rgba(34,197,94,0.1)"><div class="sv">${plan}</div><div class="sl">Plan</div></td>
          <td class="st" style="background:rgba(244,63,94,0.1)"><div class="sv">${charityPercent}%</div><div class="sl">To Charity</div></td>
        </tr>
      </table>
      <p>Your chosen charity: <span class="hl">${charityName}</span></p>
      <p>A portion of every payment goes directly to them.</p>
      <div style="text-align:center"><a href="${scoresUrl}" class="btn">Enter Your Scores →</a></div>
    </div>`);
}

export async function sendDrawResultsEmail(
  email: string, firstName: string, monthYear: string,
  winningNumbers: number[]
) {
  const drawsUrl = `${CLIENT}/dashboard/draws`;
  const balls = winningNumbers.map(n => `<span class="ball">${n}</span>`).join("");

  await sendEmail(email, `${monthYear} Draw Results 🎯`, `
    <div class="card">
      <h1>${monthYear} Draw Results 🎰</h1>
      <p>Hey ${firstName}, the results are in!</p>
      <p style="text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-top:20px">Winning Numbers</p>
      <div style="text-align:center;margin:16px 0">${balls}</div>
      <p>Log in to see if your scores matched!</p>
      <div style="text-align:center"><a href="${drawsUrl}" class="btn">Check Your Results →</a></div>
    </div>`);
}

export async function sendWinnerNotification(
  email: string, firstName: string, tier: string,
  amount: number, matchedNumbers: number[]
) {
  const tierLabel = tier.replace("_", " ");
  const balls = matchedNumbers.map(n => `<span class="ball">${n}</span>`).join("");
  const winningsUrl = `${CLIENT}/dashboard/winnings`;

  await sendEmail(email, `🎉 You Won! (${tierLabel})`, `
    <div class="card" style="border-color:rgba(245,158,11,0.3)">
      <h1>Congratulations, ${firstName}! 🏆</h1>
      <p>You matched in the <span class="hl">${tierLabel}</span> tier!</p>
      <div class="st" style="background:rgba(245,158,11,0.1)">
        <div class="sv" style="color:#fbbf24">£${(amount / 100).toFixed(2)}</div>
        <div class="sl">Your Prize</div>
      </div>
      <p style="text-align:center;color:#64748b;font-size:12px">Your matched numbers</p>
      <div style="text-align:center;margin:16px 0">${balls}</div>
      <h2>What's Next?</h2>
      <p>1. Go to <a href="${winningsUrl}" style="color:#22c55e">My Winnings</a></p>
      <p>2. Upload a screenshot of your scores as proof</p>
      <p>3. We'll verify and process your payout</p>
      <div style="text-align:center"><a href="${winningsUrl}" class="btn">Claim Your Prize →</a></div>
    </div>`);
}

export async function sendPayoutConfirmation(email: string, firstName: string, amount: number) {
  const dashboardUrl = `${CLIENT}/dashboard`;

  await sendEmail(email, "Prize Paid! 💰", `
    <div class="card">
      <h1>Payment Sent, ${firstName}! 💰</h1>
      <div class="st" style="background:rgba(34,197,94,0.1)">
        <div class="sv">£${(amount / 100).toFixed(2)}</div>
        <div class="sl">Amount Paid</div>
      </div>
      <p>Payment should arrive within 3–5 business days.</p>
      <div style="text-align:center"><a href="${dashboardUrl}" class="btn">Back to Dashboard →</a></div>
    </div>`);
}

export async function sendSubscriptionCancelled(email: string, firstName: string, endDate: string) {
  const pricingUrl = `${CLIENT}/#pricing`;

  await sendEmail(email, "Subscription Cancelled", `
    <div class="card">
      <h1>We're Sorry to See You Go, ${firstName}</h1>
      <p>Your subscription has been cancelled. Access continues until <span class="hl">${endDate}</span>.</p>
      <p>After that, you won't be entered into draws and charity contributions will stop.</p>
      <p>Changed your mind?</p>
      <div style="text-align:center"><a href="${pricingUrl}" class="btn">Resubscribe →</a></div>
    </div>`);
}

export async function sendDrawReminderEmail(
  email: string, firstName: string, monthYear: string, daysLeft: number
) {
  const drawsUrl = `${CLIENT}/dashboard/draws`;

  await sendEmail(email, `⏰ ${daysLeft} Days Left — ${monthYear} Draw`, `
    <div class="card">
      <h1>Don't Miss Out, ${firstName}! ⏰</h1>
      <p>The <span class="hl">${monthYear} draw</span> closes in <span class="hl">${daysLeft} days</span>.</p>
      <p>Make sure your scores are up to date and you've entered.</p>
      <div style="text-align:center"><a href="${drawsUrl}" class="btn">Enter Now →</a></div>
    </div>`);
}

export async function sendVerificationProofReminder(email: string, firstName: string) {
  const winningsUrl = `${CLIENT}/dashboard/winnings`;

  await sendEmail(email, "Upload Your Proof to Claim Prize 📸", `
    <div class="card">
      <h1>One Step Left, ${firstName}! 📸</h1>
      <p>You've won a prize but haven't uploaded proof yet.</p>
      <p>Please upload a screenshot of your scores from your golf app to verify your win.</p>
      <div style="text-align:center"><a href="${winningsUrl}" class="btn">Upload Proof →</a></div>
    </div>`);
}
export async function sendVerificationEmail(email: string, firstName: string, verifyUrl: string) {
  await sendEmail(email, "Verify Your Email — GolfCharity ✉️", `
    <div class="card">
      <h1>Verify Your Email, ${firstName}! ✉️</h1>
      <p>Thanks for signing up! Click the button below to verify your email and activate your account.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${verifyUrl}" class="btn" style="font-size:16px;padding:16px 32px">Verify My Email →</a>
      </div>
      <p style="color:#64748b;font-size:12px">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      <p style="color:#475569;font-size:11px;word-break:break-all;margin-top:16px">Or copy this link: ${verifyUrl}</p>
    </div>`);
}