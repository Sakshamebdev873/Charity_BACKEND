import { Request } from "express";

export interface AuthPayload {
  userId: string;
  role: "SUBSCRIBER" | "ADMIN";
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}