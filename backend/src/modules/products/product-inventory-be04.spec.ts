import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';

describe('BE-04: Product Inventory Consistency & Direct Stock Mutation Defense', () => {
  let service: ProductsService;
  let mockProductModel: any;
  let mockInventoryModel: any;

  beforeEach(() => {
    mockProductModel = {
      findByIdAndUpdate: jest.fn(),
      deleteOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(true) }),
    };

    mockInventoryModel = {
      create: jest.fn(),
    };

    service = new ProductsService(
      mockProductModel,
      {} as any, // stockAlertModel
      {} as any, // categoryModel
      mockInventoryModel,
      {} as any, // reviewsService
      {} as any, // emailService
      {} as any, // configService
    );
  });

  it('BE-04.1: update() strips stock property so generic product update cannot mutate stock', async () => {
    const productId = new Types.ObjectId().toString();
    const updatePayload: any = {
      name: 'Sach Hay Moi',
      price: 150000,
      stock: 99999, // Attempt direct stock modification
    };

    mockProductModel.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: productId,
          name: 'Sach Hay Moi',
          price: 150000,
          stock: 10, // Unchanged stock
        }),
      }),
    });

    await service.update(productId, updatePayload);

    // Verify findByIdAndUpdate was called WITHOUT stock property
    expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
      productId,
      expect.not.objectContaining({ stock: expect.anything() }),
      { returnDocument: 'after' },
    );
  });

  it('BE-04.2: create() does not swallow inventory creation failure and cleans up orphan product', async () => {
    const newId = new Types.ObjectId();
    const saveMock = jest.fn().mockResolvedValue({
      _id: newId,
      name: 'New Book',
      stock: 50,
    });

    // Mock constructor for new this.productModel
    const MockProductConstructor = jest.fn().mockImplementation(() => ({
      save: saveMock,
    }));
    (service as any).productModel = MockProductConstructor;
    (service as any).productModel.deleteOne = mockProductModel.deleteOne;

    // Simulate inventory creation failure
    mockInventoryModel.create.mockRejectedValue(
      new Error('Mongo connection drop during inventory insert'),
    );

    const dto: CreateProductDto = {
      name: 'New Book',
      sku: 'SKU-TEST-001',
      price: 100000,
      stock: 50,
      category: new Types.ObjectId().toString(),
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    expect(mockProductModel.deleteOne).toHaveBeenCalledWith({ _id: newId });
  });
});
