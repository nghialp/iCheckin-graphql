
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';

describe('AppController', () => {
  let appController: AppController;

  // Mock AppService to avoid TypeORM dependencies
  const mockAppService = {
    getHello: jest.fn().mockReturnValue('Hello World!'),
  };

  // Mock DataSource to avoid TypeORM dependencies
  const mockDataSource = {
    query: jest.fn().mockResolvedValue([{ result: 1 }]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
        { provide: 'DATA_SOURCE', useValue: mockDataSource },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(mockAppService.getHello).toHaveBeenCalled();
    });
  });
});

