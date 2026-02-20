import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PersonStatus } from 'src/common/enums/person-status.enum';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPersonDto: CreatePersonDto) {
    const person = await this.prisma.person.create({
      data: {
        ...createPersonDto,
        status: PersonStatus.ACTIVE,
      },
    });
    return person;
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
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

  async findOne(publicId: string) {
    const person = await this.prisma.person.findUnique({
      where: { publicId, status: PersonStatus.ACTIVE },
    });
    if (!person) {
      throw new NotFoundException(`Person with publicId ${publicId} not found`);
    }
    return person;
  }

  async update(publicId: string, updatePersonDto: UpdatePersonDto) {
    await this.findOne(publicId);
    const person = await this.prisma.person.update({
      where: { publicId },
      data: updatePersonDto,
    });
    return person;
  }

  async remove(publicId: string) {
    await this.findOne(publicId);
    const person = await this.prisma.person.update({
      where: { publicId },
      data: { status: PersonStatus.DELETED, deletedAt: new Date() },
    });
    return person;
  }

  async reactivate(publicId: string) {
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
