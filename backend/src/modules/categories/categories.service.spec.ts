import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './schemas/category.schema';

describe('CategoriesService (TASK 11: Multi-level Category Tree & Slug)', () => {
  let service: CategoriesService;
  let mockCategoryModel: any;

  const mockRootCat = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Văn phòng phẩm',
    slug: 'van-phong-pham',
    parentId: null,
    status: true,
    sortOrder: 1,
    products: ['607f1f77bcf86cd799439001', '607f1f77bcf86cd799439002'],
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockChildCat = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Bút - Viết',
    slug: 'but-viet',
    parentId: mockRootCat._id,
    status: true,
    sortOrder: 2,
    products: ['607f1f77bcf86cd799439003'],
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockSubChildCat = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Bút bi Thiên Long',
    slug: 'but-bi-thien-long',
    parentId: mockChildCat._id,
    status: true,
    sortOrder: 1,
    products: [],
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    mockCategoryModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: '507f1f77bcf86cd799439099',
      save: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        ...dto,
      }),
    }));

    mockCategoryModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockRootCat, mockChildCat]),
          }),
          exec: jest.fn().mockResolvedValue([mockRootCat, mockChildCat]),
        }),
        lean: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue([mockRootCat, mockChildCat, mockSubChildCat]),
        }),
        exec: jest.fn().mockResolvedValue([mockRootCat, mockChildCat]),
      }),
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockRootCat, mockChildCat]),
        }),
        exec: jest.fn().mockResolvedValue([mockRootCat, mockChildCat]),
      }),
      exec: jest.fn().mockResolvedValue([mockRootCat, mockChildCat]),
    });

    mockCategoryModel.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRootCat),
        }),
        exec: jest.fn().mockResolvedValue(mockRootCat),
      }),
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      exec: jest.fn().mockResolvedValue(mockRootCat),
    });

    mockCategoryModel.findById = jest.fn().mockImplementation((id: string) => {
      let found: any = null;
      if (id === mockRootCat._id) found = { ...mockRootCat };
      if (id === mockChildCat._id) found = { ...mockChildCat };
      if (id === mockSubChildCat._id) found = { ...mockSubChildCat };

      return {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(found),
          }),
          exec: jest.fn().mockResolvedValue(found),
        }),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(found),
        }),
        exec: jest.fn().mockResolvedValue(
          found
            ? {
                ...found,
                save: jest.fn().mockImplementation(function (this: any) {
                  return Promise.resolve(this);
                }),
              }
            : null,
        ),
      };
    });

    mockCategoryModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockRootCat,
          name: 'Văn phòng phẩm cao cấp',
          slug: 'van-phong-pham-cao-cap',
        }),
      }),
      exec: jest.fn().mockResolvedValue({
        ...mockRootCat,
        name: 'Văn phòng phẩm cao cấp',
      }),
    });

    mockCategoryModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockRootCat),
    });

    mockCategoryModel.updateMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });

    mockCategoryModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(3),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('1. Slug Generation & Deduplication', () => {
    it('should generate a valid Vietnamese slug without diacritics', async () => {
      const slug = await service.generateUniqueSlug(
        'Sách Giáo Khoa Lớp 12 & Dụng Cụ Học Tập',
      );
      expect(slug).toBe('sach-giao-khoa-lop-12-dung-cu-hoc-tap');
    });

    it('should append numeric counter if slug collision occurs', async () => {
      mockCategoryModel.findOne
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ slug: 'but-bi' }),
          }),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        });

      const slug = await service.generateUniqueSlug('Bút bi');
      expect(slug).toBe('but-bi-1');
    });
  });

  describe('2. Category Tree Construction', () => {
    it('should build a nested multi-level category tree with productCount', async () => {
      const tree = await service.getCategoryTree();
      expect(tree).toBeDefined();
      expect(tree).toHaveLength(1); // 1 Root Category

      const rootNode = tree[0];
      expect(rootNode.name).toBe('Văn phòng phẩm');
      expect(rootNode.productCount).toBe(2);
      expect(rootNode.children).toHaveLength(1);

      const childNode = rootNode.children[0];
      expect(childNode.name).toBe('Bút - Viết');
      expect(childNode.productCount).toBe(1);
      expect(childNode.children).toHaveLength(1);

      const subChildNode = childNode.children[0];
      expect(subChildNode.name).toBe('Bút bi Thiên Long');
      expect(subChildNode.productCount).toBe(0);
      expect(subChildNode.children).toHaveLength(0);
    });
  });

  describe('3. Circular Reference Prevention & Validation', () => {
    it('should throw BadRequestException when category sets itself as parent', async () => {
      const updateDto: any = {
        parentId: mockRootCat._id,
      };

      await expect(
        service.update(mockRootCat._id, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when circular hierarchy is detected (A -> B -> A)', async () => {
      // Child category mockChildCat has parent mockRootCat.
      // Trying to update mockRootCat to have parent mockChildCat should throw.
      const updateDto: any = {
        parentId: mockChildCat._id,
      };

      await expect(
        service.update(mockRootCat._id, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when non-existent parentId is provided on create', async () => {
      mockCategoryModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      const createDto: any = {
        name: 'Thước Kẻ',
        parentId: 'non-existent-parent-id',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('4. Category CRUD Operations', () => {
    it('should create a root category with auto-generated slug', async () => {
      const createDto: any = {
        name: 'Đồ chơi thông minh',
        sortOrder: 5,
      };

      const result = await service.create(createDto);
      expect(result).toBeDefined();
      expect(result.name).toBe('Đồ chơi thông minh');
      expect(result.slug).toBe('do-choi-thong-minh');
      expect(result.sortOrder).toBe(5);
    });

    it('should find category by ID', async () => {
      const result = await service.findById(mockRootCat._id);
      expect(result).toBeDefined();
      expect(result.slug).toBe('van-phong-pham');
    });

    it('should throw NotFoundException when category is not found by ID', async () => {
      mockCategoryModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
          exec: jest.fn().mockResolvedValue(null),
        }),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should find category by slug', async () => {
      const result = await service.findBySlug('van-phong-pham');
      expect(result).toBeDefined();
      expect(result.name).toBe('Văn phòng phẩm');
    });

    it('should throw NotFoundException when category slug does not exist', async () => {
      mockCategoryModel.findOne.mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
          exec: jest.fn().mockResolvedValue(null),
        }),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should safely delete category and re-parent its subcategories', async () => {
      await expect(service.delete(mockRootCat._id)).resolves.toBeUndefined();
      expect(mockCategoryModel.updateMany).toHaveBeenCalled();
      expect(mockCategoryModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockRootCat._id,
      );
    });

    it('should toggle category active status', async () => {
      const result = await service.toggleStatus(mockRootCat._id);
      expect(result).toBeDefined();
      expect(result.status).toBe(false); // was true, toggled to false
    });
  });
});
