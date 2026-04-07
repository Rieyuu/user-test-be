import { IsDateString, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const JURUSAN_VALUES = [
  'Informatika',
  'Sistem Informasi',
  'Teknik Elektro',
  'Manajemen',
] as const;

export type Jurusan = (typeof JURUSAN_VALUES)[number];

export class CreateMahasiswaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nim: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nama: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsIn([...JURUSAN_VALUES])
  jurusan: Jurusan;

  @IsDateString()
  @IsOptional()
  tanggal_lahir?: string;
}

