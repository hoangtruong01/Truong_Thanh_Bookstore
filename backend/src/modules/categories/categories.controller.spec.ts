import { CategoriesController } from './categories.controller';

describe('CategoriesController.getTree — SEC-016 includeInactive', () => {
  let controller: CategoriesController;
  let service: { getCategoryTree: jest.Mock };

  beforeEach(() => {
    service = { getCategoryTree: jest.fn().mockResolvedValue([]) };
    controller = new CategoriesController(service as never);
  });

  it('khách vãng lai gửi includeInactive=true bị bỏ qua', async () => {
    await controller.getTree('true', undefined);
    expect(service.getCategoryTree).toHaveBeenCalledWith(false);
    await controller.getTree('true', null);
    expect(service.getCategoryTree).toHaveBeenLastCalledWith(false);
  });

  it('CUSTOMER gửi includeInactive=true bị bỏ qua', async () => {
    await controller.getTree('true', { role: 'CUSTOMER' });
    expect(service.getCategoryTree).toHaveBeenCalledWith(false);
  });

  it('ADMIN / STAFF / SUPER_ADMIN được xem danh mục ẩn', async () => {
    for (const role of ['ADMIN', 'STAFF', 'SUPER_ADMIN']) {
      service.getCategoryTree.mockClear();
      await controller.getTree('true', { role });
      expect(service.getCategoryTree).toHaveBeenCalledWith(true);
    }
  });

  it('không truyền includeInactive thì luôn false kể cả admin', async () => {
    await controller.getTree(undefined, { role: 'ADMIN' });
    expect(service.getCategoryTree).toHaveBeenCalledWith(false);
  });
});
