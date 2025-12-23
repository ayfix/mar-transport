export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  __v?: number;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}
