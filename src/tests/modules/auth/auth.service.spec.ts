
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../modules/auth/auth.service';
import { EmployeeRepository } from '../../../modules/employee/employee.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let repo: EmployeeRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EmployeeRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repo = module.get<EmployeeRepository>(EmployeeRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'pass');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const user = { id: '1', email: 'test@example.com', password: 'hashed_pass' };
      jest.spyOn(repo, 'findOne').mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong_pass');
      expect(result).toBeNull();
    });

    it('should return user (without password) if credentials are valid', async () => {
      const user = { id: '1', email: 'test@example.com', password: 'hashed_pass', role: 'EMPLOYEE' };
      jest.spyOn(repo, 'findOne').mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'pass');
      expect(result).toEqual({ id: '1', email: 'test@example.com', role: 'EMPLOYEE' });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const user = { id: '1', email: 'test@example.com', role: 'EMPLOYEE' };
      const token = 'jwt_token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.login(user);
      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith({ email: user.email, sub: user.id, role: user.role });
    });
  });
});
