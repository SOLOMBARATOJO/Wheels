export interface MwUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

export interface RegisterResult {
  userId: number;
  status: string;
  emailSent: boolean;
  message: string;
}

export interface LoginResult {
  success: boolean;
  user: MwUser;
  message: string;
}