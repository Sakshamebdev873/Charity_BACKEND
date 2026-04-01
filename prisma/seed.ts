import {
  PrismaClient,
  UserRole,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Platform Config (all amounts in paisa) ──
  const configs = [
    { key: "monthly_price_paisa", value: "19900" },       // ₹199
    { key: "yearly_price_paisa", value: "199900" },        // ₹1,999
    { key: "currency", value: "INR" },
    { key: "prize_pool_percent", value: "50" },
    { key: "min_charity_percent", value: "10" },
    { key: "five_match_pool_share", value: "40" },
    { key: "four_match_pool_share", value: "35" },
    { key: "three_match_pool_share", value: "25" },
  ];

  for (const config of configs) {
    await prisma.platformConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log("✓ Platform config seeded (INR)");

  // ── Admin User ──
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@golfcharity.com" },
    update: {},
    create: {
      email: "admin@golfcharity.com",
      passwordHash: adminHash,
      firstName: "Platform",
      lastName: "Admin",
      role: UserRole.ADMIN,
      emailVerified: true,
      country: "IN",
    },
  });
  console.log("✓ Admin:", admin.email);

  // ── Test Subscriber ──
  const userHash = await bcrypt.hash("user123", 12);
  const testUser = await prisma.user.upsert({
    where: { email: "testuser@example.com" },
    update: {},
    create: {
      email: "testuser@example.com",
      passwordHash: userHash,
      firstName: "Test",
      lastName: "Golfer",
      role: UserRole.SUBSCRIBER,
      emailVerified: true,
      country: "IN",
    },
  });

  // Active subscription — ₹199/month = 19900 paisa
  await prisma.subscription.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      plan: SubscriptionPlan.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      priceInCents: 19900, // ₹199 in paisa
      charityPercentage: 15,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✓ Subscriber:", testUser.email);

  // ── Second Test User (no subscription) ──
  const user2Hash = await bcrypt.hash("user456", 12);
  const testUser2 = await prisma.user.upsert({
    where: { email: "golfer2@example.com" },
    update: {},
    create: {
      email: "golfer2@example.com",
      passwordHash: user2Hash,
      firstName: "Rahul",
      lastName: "Sharma",
      role: UserRole.SUBSCRIBER,
      emailVerified: true,
      country: "IN",
    },
  });
  console.log("✓ Second user:", testUser2.email);

  // ── Charities ──
  const charities = [
    {
      name: "Golf For Good Foundation",
      slug: "golf-for-good",
      description:
        "Bringing the game of golf to underprivileged youth worldwide through coaching, mentorship, and equipment programs across India and beyond.",
      category: "Youth & Education",
      isFeatured: true,
      country: "IN",
    },
    {
      name: "Green Fairways Trust",
      slug: "green-fairways-trust",
      description:
        "Environmental conservation through sustainable golf course management, water recycling, and biodiversity preservation programs.",
      category: "Environment",
      isFeatured: false,
      country: "IN",
    },
    {
      name: "Drive Against Hunger",
      slug: "drive-against-hunger",
      description:
        "Using the power of sport to fight food insecurity in local communities. Every subscription helps feed families in need.",
      category: "Food & Hunger",
      isFeatured: true,
      country: "IN",
    },
    {
      name: "Swing for Veterans",
      slug: "swing-for-veterans",
      description:
        "Supporting mental health and rehabilitation for armed forces veterans through golf therapy, community events, and counselling.",
      category: "Veterans & Health",
      isFeatured: false,
      country: "IN",
    },
    {
      name: "Tee Up For Kids",
      slug: "tee-up-for-kids",
      description:
        "Providing golf scholarships and mentoring for talented young players from disadvantaged backgrounds across tier-2 and tier-3 cities.",
      category: "Youth & Education",
      isFeatured: true,
      country: "IN",
    },
  ];

  for (const charity of charities) {
    await prisma.charity.upsert({
      where: { slug: charity.slug },
      update: {},
      create: { ...charity, isActive: true },
    });
  }
  console.log(`✓ ${charities.length} charities seeded`);

  // ── Charity Events ──
  const golfForGood = await prisma.charity.findUnique({
    where: { slug: "golf-for-good" },
  });
  const driveHunger = await prisma.charity.findUnique({
    where: { slug: "drive-against-hunger" },
  });

  if (golfForGood) {
    await prisma.charityEvent.createMany({
      data: [
        {
          charityId: golfForGood.id,
          title: "Annual Charity Golf Day 2026",
          description: "Join us for 18 holes raising money for youth programs. Open to all skill levels.",
          eventDate: new Date("2026-06-15"),
          location: "DLF Golf & Country Club, Gurugram",
        },
        {
          charityId: golfForGood.id,
          title: "Summer Youth Golf Camp",
          description: "Week-long residential golf camp for underprivileged kids aged 10-16.",
          eventDate: new Date("2026-07-20"),
          location: "Tollygunge Club, Kolkata",
        },
      ],
      skipDuplicates: true,
    });
  }

  if (driveHunger) {
    await prisma.charityEvent.createMany({
      data: [
        {
          charityId: driveHunger.id,
          title: "Golf for Meals — Fundraiser Tournament",
          description: "Every birdie feeds a family for a week. 9-hole scramble format.",
          eventDate: new Date("2026-08-10"),
          location: "KGA Golf Course, Bangalore",
        },
      ],
      skipDuplicates: true,
    });
  }
  console.log("✓ Charity events seeded");

  // ── Test User Charity Selection ──
  if (golfForGood) {
    await prisma.userCharitySelection.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        charityId: golfForGood.id,
        contributionPercent: 15,
      },
    });
    console.log("✓ Test user charity selection seeded");
  }

  // ── Test User Scores (5 rolling scores) ──
  const sampleScores = [36, 29, 42, 31, 38];
  for (let i = 0; i < sampleScores.length; i++) {
    const playedOn = new Date();
    playedOn.setDate(playedOn.getDate() - i * 7);

    await prisma.golfScore.upsert({
      where: { userId_position: { userId: testUser.id, position: i + 1 } },
      update: { score: sampleScores[i], playedOn },
      create: {
        userId: testUser.id,
        score: sampleScores[i],
        playedOn,
        position: i + 1,
      },
    });
  }
  console.log("✓ Test user golf scores seeded [36, 29, 42, 31, 38]");

  // ── Sample Draw (April 2026) ──
  const draw = await prisma.draw.upsert({
    where: { monthYear: "2026-04" },
    update: {},
    create: {
      drawDate: new Date("2026-04-30"),
      monthYear: "2026-04",
      type: "RANDOM",
      status: "SCHEDULED",
      winningNumbers: [],
    },
  });

  // Enter test user into draw
  await prisma.drawEntry.upsert({
    where: { drawId_userId: { drawId: draw.id, userId: testUser.id } },
    update: {},
    create: {
      drawId: draw.id,
      userId: testUser.id,
      scores: sampleScores,
    },
  });
  console.log("✓ April 2026 draw + test user entry seeded");

  // ── Sample Payment (₹199 = 19900 paisa) ──
  // Split: 15% charity = ₹29.85 (2985p), remaining ₹169.15
  //        50% of remaining to prize pool = ₹84.58 (8458p)
  //        50% platform = ₹84.57 (8457p)
  const sub = await prisma.subscription.findUnique({ where: { userId: testUser.id } });
  if (sub) {
    const amountPaisa = 19900;
    const charityShare = Math.floor(amountPaisa * 0.15); // 2985
    const remaining = amountPaisa - charityShare;         // 16915
    const prizePoolShare = Math.floor(remaining * 0.5);   // 8457
    const platformShare = remaining - prizePoolShare;     // 8458

    await prisma.payment.create({
      data: {
        subscriptionId: sub.id,
        amountInCents: amountPaisa,
        currency: "INR",
        prizePoolShare,
        charityShare,
        platformShare,
      },
    });

    if (golfForGood) {
      await prisma.donation.create({
        data: {
          userId: testUser.id,
          charityId: golfForGood.id,
          amountInCents: charityShare,
          currency: "INR",
          isIndependent: false,
        },
      });
    }
    console.log(`✓ Payment seeded: ₹${(amountPaisa / 100).toFixed(2)} (pool: ₹${(prizePoolShare / 100).toFixed(2)}, charity: ₹${(charityShare / 100).toFixed(2)}, platform: ₹${(platformShare / 100).toFixed(2)})`);
  }

  // ── Notifications ──
  await prisma.notification.createMany({
    data: [
      {
        userId: testUser.id,
        title: "Welcome to Golf Charity Platform! 🏌️",
        body: "Thanks for subscribing. Enter your scores and join this month's draw to win prizes!",
        type: "SYSTEM",
      },
      {
        userId: testUser.id,
        title: "April 2026 Draw — Now Open",
        body: "The April draw is accepting entries. Your scores [36, 29, 42, 31, 38] are ready. Enter now!",
        type: "DRAW_REMINDER",
      },
      {
        userId: testUser.id,
        title: "Your Charity: Golf For Good Foundation",
        body: "15% of your ₹199/month subscription (₹29.85) goes directly to Golf For Good Foundation.",
        type: "CHARITY_UPDATE",
      },
    ],
  });
  console.log("✓ Notifications seeded");

  // ── Summary ──
  console.log("\n🎉 Seeding complete!");
  console.log("═══════════════════════════════════════════");
  console.log("  💰 Currency: INR (₹)");
  console.log("  📋 Monthly: ₹199 (19,900 paisa)");
  console.log("  📋 Yearly:  ₹1,999 (1,99,900 paisa)");
  console.log("───────────────────────────────────────────");
  console.log("  👤 Admin:    admin@golfcharity.com / admin123");
  console.log("  👤 User 1:   testuser@example.com / user123");
  console.log("  👤 User 2:   golfer2@example.com / user456 (no sub)");
  console.log("───────────────────────────────────────────");
  console.log("  🎯 Scores:   [36, 29, 42, 31, 38]");
  console.log("  🎰 Draw:     April 2026 (SCHEDULED)");
  console.log("  ❤️  Charity:  Golf For Good Foundation (15%)");
  console.log("═══════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());