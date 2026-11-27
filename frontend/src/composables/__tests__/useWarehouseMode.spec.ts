import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWarehouseMode } from '../useWarehouseMode';
import warehouseService from '@/services/warehouse.service';

vi.mock('@/services/warehouse.service', () => ({
  default: {
    getMode: vi.fn(),
  },
}));

describe('useWarehouseMode (TASK-016: Single-Warehouse Mode Toggle)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default single warehouse mode state and setter', () => {
    const { isSingleWarehouse, setSingleWarehouseMode } = useWarehouseMode();
    expect(typeof isSingleWarehouse.value).toBe('boolean');

    setSingleWarehouseMode(true);
    expect(isSingleWarehouse.value).toBe(true);

    setSingleWarehouseMode(false);
    expect(isSingleWarehouse.value).toBe(false);
  });

  it('fetches warehouse mode from backend and updates state', async () => {
    vi.mocked(warehouseService.getMode).mockResolvedValueOnce({
      singleWarehouseMode: true,
      defaultWarehouse: {
        _id: 'wh-main',
        code: 'KHO-TONG',
        name: 'Kho Tổng Trường Thành',
        type: 'MAIN',
      },
    });

    const { isSingleWarehouse, defaultWarehouseInfo, fetchWarehouseMode } = useWarehouseMode();
    await fetchWarehouseMode();

    expect(isSingleWarehouse.value).toBe(true);
    expect(defaultWarehouseInfo.value?.code).toBe('KHO-TONG');
  });

  it('handles backend error gracefully without crashing', async () => {
    vi.mocked(warehouseService.getMode).mockRejectedValueOnce(new Error('Network error'));

    const { isSingleWarehouse, fetchWarehouseMode } = useWarehouseMode();
    await fetchWarehouseMode();

    expect(typeof isSingleWarehouse.value).toBe('boolean');
  });
});
