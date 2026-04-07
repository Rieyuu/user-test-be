export class UserResponseDto {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  register_date: Date | null;
}
