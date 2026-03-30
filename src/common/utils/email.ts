/**
 * Email utility — plug in Resend, Nodemailer, etc.
 * This is a placeholder; replace with your email provider.
 */

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  // TODO: Integrate with Resend or your email provider
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
}

export async function sendWinnerNotification(
  email: string,
  tier: string,
  amount: number
): Promise<void> {
  await sendEmail(
    email,
    `🎉 You're a winner! (${tier})`,
    `<h1>Congratulations!</h1><p>You matched in the ${tier} tier and won £${(amount / 100).toFixed(2)}!</p><p>Please upload your score proof to claim your prize.</p>`
  );
}

export async function sendDrawResultsEmail(
  email: string,
  winningNumbers: number[]
): Promise<void> {
  await sendEmail(
    email,
    "Monthly Draw Results Are In!",
    `<h1>Draw Results</h1><p>This month's winning numbers: ${winningNumbers.join(", ")}</p>`
  );
}