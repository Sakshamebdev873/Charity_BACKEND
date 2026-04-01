import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { RegisterInput, LoginInput } from "./auth.schema";
import { sendVerificationEmail } from "../../common/utils/email";

export class AuthService {
  static async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new Error("Email already registered");

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email (non-blocking)
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
    sendVerificationEmail(user.email, user.firstName, verifyUrl).catch(console.error);

    return {
      user,
      message: "Registration successful. Please check your email to verify your account.",
    };
  }

  static async verifyEmail(token: string) {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) throw new Error("Invalid verification link");
    if (record.expiresAt < new Date()) throw new Error("Verification link has expired");

    // Mark email as verified
    const user = await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
      },
    });

    // Delete used token
    await prisma.verificationToken.delete({ where: { id: record.id } });

    // Generate JWT now that email is verified
    const jwtToken = this.generateToken(user.id, user.role);

    return { user, token: jwtToken };
  }

  static async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Email not found");
    if (user.emailVerified) throw new Error("Email already verified");

    // Delete old tokens
    await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

    // Create new token
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
    sendVerificationEmail(user.email, user.firstName, verifyUrl).catch(console.error);

    return { message: "Verification email sent" };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new Error("Invalid email or password");

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new Error("Invalid email or password");

    if (!user.isActive) throw new Error("Account is deactivated");

    // Check email verification
    if (!user.emailVerified) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }

  static async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        country: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            charityPercentage: true,
          },
        },
        charitySelection: {
          include: { charity: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
  }

  private static generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}