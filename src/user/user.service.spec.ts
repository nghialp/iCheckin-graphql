
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      const createdUser = { id: '1', ...userData, points: 0, level: 1 };

      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
      expect(mockUserRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ 
        where: { email: 'test@example.com' } 
      });
      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const user = { id: '123', email: 'test@example.com', name: 'Test' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: '123' } 
      });
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update and return the updated user', async () => {
      const updatedUser = { id: '123', email: 'updated@example.com', name: 'Updated' };
      mockUserRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockUserRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.update('123', { name: 'Updated' });

      expect(mockUserRepository.update).toHaveBeenCalledWith('123', { name: 'Updated' });
      expect(result).toEqual(updatedUser);
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.update.mockResolvedValue({ affected: 0 } as any);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' }))
        .rejects.toThrow('User not found');
    });
  });

  describe('getAll with pagination', () => {
    it('should return paginated users', async () => {
      const users = [
        { id: '1', email: 'user1@example.com', name: 'User 1' },
        { id: '2', email: 'user2@example.com', name: 'User 2' },
      ] as User[];

      mockUserRepository.findAndCount.mockResolvedValue([users, 10]);

      const result = await service.getAll(1, 10);

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      });
      expect(result).toEqual({
        users,
        total: 10,
        page: 1,
        lastPage: 1,
      });
    });

    it('should handle custom page and limit', async () => {
      const users = [{ id: '1', email: 'user1@example.com', name: 'User 1' }] as User[];
      mockUserRepository.findAndCount.mockResolvedValue([users, 50]);

      const result = await service.getAll(2, 10);

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 10,
      });
      expect(result).toEqual({
        users,
        total: 50,
        page: 2,
        lastPage: 5,
      });
    });

    it('should limit max page size to 100', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getAll(1, 200);

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 100,
        skip: 0,
      });
    });
  });

  describe('addPoints', () => {
    it('should add points to user', async () => {
      const user = { id: '123', points: 50, email: 'test@example.com', name: 'Test' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({ ...user, points: 100 });

      await service.addPoints('123', 50);

      expect(user.points).toBe(100);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.addPoints('nonexistent', 50))
        .rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should return true when user is deleted', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.delete('123');

      expect(result).toBe(true);
    });

    it('should return false when user is not found', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('findUsersByIds', () => {
    it('should return empty array when ids are empty', async () => {
      const result = await service.findUsersByIds([]);
      expect(result).toEqual([]);
    });

    it('should return users by ids', async () => {
      const users = [{ id: '1' }, { id: '2' }] as User[];
      const queryBuilder = {
        whereInIds: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(users),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.findUsersByIds(['1', '2']);

      expect(result).toEqual(users);
    });
  });
});

