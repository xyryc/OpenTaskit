import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Automatically create URL-friendly slug from category name
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  // 1. Create (or Smart Reactivate) Category
  async create(dto: CreateCategoryDto) {
    const slug = dto.slug
      ? this.createSlug(dto.slug)
      : this.createSlug(dto.name);

    // Check if category already exists in database
    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug }],
      },
    });

    if (existing) {
      // 💡 If it already exists but is inactive, reactivate it!
      if (!existing.isActive) {
        const reactivated = await this.prisma.category.update({
          where: { id: existing.id },
          data: {
            ...dto,
            slug,
            isActive: true, // Reactivate
          },
        });

        return {
          message:
            'An inactive category with this name was found and reactivated successfully.',
          category: reactivated,
        };
      }

      // If it is already active, prevent duplicate
      throw new ConflictException(
        'An active category with this name or slug already exists',
      );
    }

    // Create fresh category
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        icon: dto.icon,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      message: 'Category created successfully',
      category,
    };
  }

  // 2. Get All Active Categories (Public for Frontend dropdowns/chips)
  async findAll(includeInactive: boolean = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  // 3. Get Single Category by ID
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // 4. Update Category (Admin)
  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id); // Throws 404 if not found

    let slug: string | undefined = undefined;
    if (dto.slug) {
      slug = this.createSlug(dto.slug);
    } else if (dto.name) {
      slug = this.createSlug(dto.name);
    }

    // Check conflict if name/slug changed
    if (dto.name || slug) {
      const conflict = await this.prisma.category.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(dto.name ? [{ name: dto.name }] : []),
            ...(slug ? [{ slug }] : []),
          ],
        },
      });

      if (conflict) {
        throw new ConflictException(
          'Another category with this name or slug already exists',
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        ...(slug ? { slug } : {}),
      },
    });

    return {
      message: 'Category updated successfully',
      category: updated,
    };
  }

  // 5. Safe Delete / Deactivate Category (Admin)
  async remove(id: string) {
    const category = await this.findOne(id);

    // 💡 If tasks are linked to this category, don't break them! Soft-delete instead.
    if (category._count.tasks > 0) {
      await this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        message:
          'Category has linked tasks, so it was safely deactivated instead of deleted.',
      };
    }

    // If no tasks exist, it is safe to delete permanently
    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted permanently.',
    };
  }
}
