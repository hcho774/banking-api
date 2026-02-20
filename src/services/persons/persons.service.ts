import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { parsePagination } from 'src/common/utils/pagination.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { Person } from 'src/prisma/prismaClient';
import { PersonStatus } from 'src/common/enums/person-status.enum';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPersonDto: CreatePersonDto): Promise<Person> {
    const person = await this.prisma.person.create({
      data: {
        ...createPersonDto,
        status: PersonStatus.ACTIVE,
      },
    });

    return person;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Person>> {
    const { page, limit, skip } = parsePagination(query);
    const where = { status: PersonStatus.ACTIVE };

    const [persons, total] = await Promise.all([
      this.prisma.person.findMany({ where, skip, take: limit }),
      this.prisma.person.count({ where }),
    ]);

    return {
      items: persons,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(publicId: string): Promise<Person> {
    const person = await this.prisma.person.findUnique({
      where: { publicId, status: PersonStatus.ACTIVE },
    });
    if (!person) {
      throw new NotFoundException(`Person with publicId ${publicId} not found`);
    }

    return person;
  }

  async update(
    publicId: string,
    updatePersonDto: UpdatePersonDto,
  ): Promise<Person> {
    await this.findOne(publicId);

    const person = await this.prisma.person.update({
      where: { publicId },
      data: updatePersonDto,
    });

    return person;
  }

  async remove(publicId: string): Promise<Person> {
    await this.findOne(publicId);

    const person = await this.prisma.person.update({
      where: { publicId },
      data: { status: PersonStatus.DELETED, deletedAt: new Date() },
    });

    return person;
  }

  async reactivate(publicId: string): Promise<Person> {
    const person = await this.prisma.person.findUnique({
      where: {
        publicId,
        status: { in: [PersonStatus.DELETED, PersonStatus.INACTIVE] },
      },
    });
    if (!person) {
      throw new NotFoundException(
        `Person with publicId ${publicId} not found or already active`,
      );
    }

    const reactivated = await this.prisma.person.update({
      where: { publicId },
      data: { status: PersonStatus.ACTIVE, deletedAt: null },
    });

    return reactivated;
  }
}
