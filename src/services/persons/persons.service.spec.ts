import { Test, TestingModule } from '@nestjs/testing';
import { PersonsService } from './persons.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { PersonStatus } from 'src/common/enums/person-status.enum';

const mockPerson = {
  personId: 1,
  publicId: 'uuid-1234',
  name: 'John Doe',
  document: '123.456.789-00',
  birthDate: new Date('1990-01-15'),
  status: PersonStatus.ACTIVE,
  deletedAt: null,
};

const mockPrisma = {
  person: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

describe('PersonsService', () => {
  let service: PersonsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PersonsService>(PersonsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a person with ACTIVE status', async () => {
      prisma.person.create.mockResolvedValue(mockPerson);

      const result = await service.create({
        name: 'John Doe',
        document: '123.456.789-00',
        birthDate: new Date('1990-01-15'),
      });

      expect(result).toEqual(mockPerson);
      expect(prisma.person.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          document: '123.456.789-00',
          birthDate: new Date('1990-01-15'),
          status: PersonStatus.ACTIVE,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated persons', async () => {
      prisma.person.findMany.mockResolvedValue([mockPerson]);
      prisma.person.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toEqual([mockPerson]);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should use default pagination when no params', async () => {
      prisma.person.findMany.mockResolvedValue([]);
      prisma.person.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return a person by publicId', async () => {
      prisma.person.findUnique.mockResolvedValue(mockPerson);

      const result = await service.findOne('uuid-1234');

      expect(result).toEqual(mockPerson);
      expect(prisma.person.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'uuid-1234', status: PersonStatus.ACTIVE },
      });
    });

    it('should throw NotFoundException if person not found', async () => {
      prisma.person.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update person details', async () => {
      const updated = { ...mockPerson, name: 'Jane Doe' };
      prisma.person.findUnique.mockResolvedValue(mockPerson);
      prisma.person.update.mockResolvedValue(updated);

      const result = await service.update('uuid-1234', { name: 'Jane Doe' });

      expect(result.name).toBe('Jane Doe');
    });

    it('should throw NotFoundException if person does not exist', async () => {
      prisma.person.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete with DELETED status and deletedAt', async () => {
      const deleted = {
        ...mockPerson,
        status: PersonStatus.DELETED,
        deletedAt: new Date(),
      };
      prisma.person.findUnique.mockResolvedValue(mockPerson);
      prisma.person.update.mockResolvedValue(deleted);

      const result = await service.remove('uuid-1234');

      expect(result.status).toBe(PersonStatus.DELETED);
      expect(result.deletedAt).toBeDefined();
      expect(prisma.person.update).toHaveBeenCalledWith({
        where: { publicId: 'uuid-1234' },
        data: { status: PersonStatus.DELETED, deletedAt: expect.any(Date) },
      });
    });
  });

  describe('reactivate', () => {
    it('should reactivate a deleted person', async () => {
      const deletedPerson = {
        ...mockPerson,
        status: PersonStatus.DELETED,
        deletedAt: new Date(),
      };
      const reactivated = {
        ...mockPerson,
        status: PersonStatus.ACTIVE,
        deletedAt: null,
      };
      prisma.person.findUnique.mockResolvedValue(deletedPerson);
      prisma.person.update.mockResolvedValue(reactivated);

      const result = await service.reactivate('uuid-1234');

      expect(result.status).toBe(PersonStatus.ACTIVE);
      expect(result.deletedAt).toBeNull();
    });

    it('should throw NotFoundException if person is already active', async () => {
      prisma.person.findUnique.mockResolvedValue(null);

      await expect(service.reactivate('uuid-1234')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
