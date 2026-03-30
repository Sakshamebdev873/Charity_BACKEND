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

  // ── Platform Config ──
  const configs = [
    { key: "monthly_price_cents", value: "999" },
    { key: "yearly_price_cents", value: "9990" },
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
  console.log("✓ Platform config seeded");

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
    },
  });
  console.log("✓ Admin user seeded:", admin.email);

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
    },
  });

  // Active subscription
  await prisma.subscription.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      plan: SubscriptionPlan.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      priceInCents: 999,
      charityPercentage: 15,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✓ Test subscriber seeded:", testUser.email);

  // ── Charities ──
  const charities = [
    {
      name: "Golf For Good Foundation",
      slug: "golf-for-good",
      description:
        "Bringing the game of golf to underprivileged youth worldwide through coaching and equipment programs.",
      category: "Youth & Education",
      isFeatured: true,
    },
    {
      name: "Green Fairways Trust",
      slug: "green-fairways-trust",
      description:
        "Environmental conservation through sustainable golf course management and biodiversity programs.",
      category: "Environment",
      isFeatured: false,
    },
    {
      name: "Drive Against Hunger",
      slug: "drive-against-hunger",
      description:
        "Using the power of sport to fight food insecurity in local communities across the UK.",
      category: "Food & Hunger",
      isFeatured: true,
    },
    {
      name: "Swing for Veterans",
      slug: "swing-for-veterans",
      description:
        "Supporting mental health and rehabilitation for veterans through golf therapy and community.",
      category: "Veterans & Health",
      isFeatured: false,
    },
    {
      name: "Tee Up For Kids",
      slug: "tee-up-for-kids",
      description:
        "Providing golf scholarships and mentoring for talented young players from disadvantaged backgrounds.",
      category: "Youth & Education",
      isFeatured: true,
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

  if (golfForGood) {
    await prisma.charityEvent.createMany({
      data: [
        {
          charityId: golfForGood.id,
          title: "Annual Charity Golf Day 2026",
          description: "Join us for 18 holes of golf raising money for youth programs.",
          eventDate: new Date("2026-06-15"),
          location: "St Andrews, Scotland",
        },
        {
          charityId: golfForGood.id,
          title: "Summer Youth Camp",
          description: "Week-long golf camp for underprivileged kids aged 10-16.",
          eventDate: new Date("2026-07-20"),
          location: "Manchester, England",
        },
      ],
      skipDuplicates: true,
    });
    console.log("✓ Charity events seeded");
  }

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
  console.log("✓ Test user golf scores seeded");

  // ── Sample Draw ──
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
  console.log("✓ Sample draw + entry seeded");

  // ── Sample Payment ──
  const sub = await prisma.subscription.findUnique({ where: { userId: testUser.id } });
  if (sub) {
    await prisma.payment.create({
      data: {
        subscriptionId: sub.id,
        amountInCents: 999,
        prizePoolShare: 425,
        charityShare: 150,
        platformShare: 424,
      },
    });

    // Donation record
    if (golfForGood) {
      await prisma.donation.create({
        data: {
          userId: testUser.id,
          charityId: golfForGood.id,
          amountInCents: 150,
          isIndependent: false,
        },
      });
    }
    console.log("✓ Sample payment + donation seeded");
  }

  // ── Notifications ──
  await prisma.notification.createMany({
    data: [
      {
        userId: testUser.id,
        title: "Welcome to Golf Charity Platform!",
        body: "Thanks for subscribing. Enter your scores and join this month's draw!",
        type: "SYSTEM",
      },
      {
        userId: testUser.id,
        title: "April Draw Now Open",
        body: "The April 2026 draw is accepting entries. Make sure your 5 scores are up to date.",
        type: "DRAW_RESULT",
      },
    ],
  });
  console.log("✓ Notifications seeded");

  console.log("\n🎉 Seeding complete!");
  console.log("─────────────────────────────────────");
  console.log("  Admin:  admin@golfcharity.com / admin123");
  console.log("  User:   testuser@example.com / user123");
  console.log("─────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());