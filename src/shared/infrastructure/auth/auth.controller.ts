import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Role } from './auth.constants';
import { Public } from './public.decorator';
import { CUSTOMER_USE_CASE_TOKENS } from '../../../customer/application/injection-tokens';
import { RegisterCustomerUseCase } from '../../../customer/application/use-cases/register-customer/register-customer.use-case';
import { FindCustomerByUserIdUseCase } from '../../../customer/application/use-cases/find-customer-by-user-id/find-customer-by-user-id.use-case';

class RegisterRequest {
  @ApiProperty({ example: 'user-123', description: 'User ID (min 3 chars)' })
  @IsString()
  @MinLength(3)
  userId!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'securepassword', description: 'Password (min 8 chars)' })
  @IsString()
  @MinLength(8)
  password!: string;
}

class LoginRequest {
  @ApiProperty({ example: 'user-123', description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: Role, example: Role.CUSTOMER, description: 'User role' })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ example: 'securepassword', description: 'Password (required for customer role)', required: false })
  @IsOptional()
  @IsString()
  password?: string;
}

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(CUSTOMER_USE_CASE_TOKENS.REGISTER)
    private readonly registerCustomerUseCase: RegisterCustomerUseCase,
    @Inject(CUSTOMER_USE_CASE_TOKENS.FIND_BY_USER_ID)
    private readonly findCustomerByUserIdUseCase: FindCustomerByUserIdUseCase,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Customer registered and JWT returned' })
  @ApiResponse({ status: 409, description: 'UserId already taken' })
  async register(
    @Body() request: RegisterRequest,
  ): Promise<{ accessToken: string }> {
    await this.registerCustomerUseCase.execute({
      userId: request.userId,
      email: request.email,
      name: request.name,
      password: request.password,
    });

    const payload = { sub: request.userId, role: Role.CUSTOMER };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiResponse({ status: 200, description: 'JWT token returned' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() request: LoginRequest): Promise<{ accessToken: string }> {
    if (request.role === Role.CUSTOMER) {
      const customer = await this.findCustomerByUserIdUseCase.execute({
        userId: request.userId,
      });

      if (!customer) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordMatch = await bcrypt.compare(
        request.password ?? '',
        customer.passwordHash,
      );

      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const payload = { sub: request.userId, role: request.role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
