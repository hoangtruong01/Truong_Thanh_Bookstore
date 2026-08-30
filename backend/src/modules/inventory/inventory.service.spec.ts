import { InventoryService } from './inventory.service';
import { InventoryTransactionType } from '../../common/enums';

const query = (value: any) => ({
  session: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

describe('Task 20: Five-type inventory ledger', () => {
  function createService(stockAfter: number) {
    const inventory = {
      currentStock: stockAfter,
      minStock: 10,
    };
    const inventoryModel: any = {
      findOne: jest.fn().mockReturnValue(query(inventory)),
    };
    const transactionModel: any = {
      findOne: jest.fn().mockReturnValue(query(null)),
      create: jest.fn().mockResolvedValue({}),
    };
    const products: any = {
      deductStock: jest.fn().mockResolvedValue(undefined),
      updateStock: jest.fn().mockResolvedValue(undefined),
    };
    return {
      service: new InventoryService(inventoryModel, transactionModel, products),
      transactionModel,
      products,
    };
  }

  it('records IMPORT with before/after balances', async () => {
    const { service, transactionModel, products } = createService(15);
    await service.importStock({ product: '507f1f77bcf86cd799439011', quantity: 5 });
    expect(products.updateStock).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      5,
      undefined,
    );
    expect(transactionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: InventoryTransactionType.IMPORT,
        change: 5,
        stockBefore: 10,
        stockAfter: 15,
      }),
    );
  });

  it.each([
    [InventoryTransactionType.SALE, 'exportStock'],
    [InventoryTransactionType.DAMAGE, 'damageStock'],
  ] as const)('prevents negative stock through atomic deduction for %s', async (type, method) => {
    const { service, transactionModel, products } = createService(7);
    await (service[method] as any).call(service, {
      product: '507f1f77bcf86cd799439011',
      quantity: 3,
    });
    expect(products.deductStock).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      3,
      undefined,
    );
    expect(transactionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ type, change: -3, stockBefore: 10, stockAfter: 7 }),
    );
  });

  it('supports signed ADJUSTMENT and RETURN movements', async () => {
    const adjustment = createService(8);
    await adjustment.service.adjustStock({
      product: '507f1f77bcf86cd799439011',
      quantity: -2,
    });
    expect(adjustment.transactionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: InventoryTransactionType.ADJUSTMENT, change: -2 }),
    );

    const returned = createService(12);
    await returned.service.returnStock({
      product: '507f1f77bcf86cd799439011',
      quantity: 2,
    });
    expect(returned.transactionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: InventoryTransactionType.RETURN, change: 2 }),
    );
  });
});
