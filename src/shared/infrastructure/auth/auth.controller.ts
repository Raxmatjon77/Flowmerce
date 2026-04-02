import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { IsEnum, IsString } from 'class-validator';
import { Role } from './auth.constants';
import { Public } from './public.decorator';

class LoginRequest {
  @ApiProperty({ example: 'user-123', description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: Role, example: Role.CUSTOMER, description: 'User role' })
  @IsEnum(Role)
  role!: Role;
}

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'JWT token returned' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async login(@Body() request: LoginRequest): Promise<{ accessToken: string }> {
    const payload = { sub: request.userId, role: request.role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
