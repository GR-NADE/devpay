export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
}