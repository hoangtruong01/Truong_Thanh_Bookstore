import { ref, computed } from 'vue';
import warehouseService from '@/services/warehouse.service';

const isSingleWarehouseState = ref<boolean>(
  import.meta.env.VITE_SINGLE_WAREHOUSE_MODE !== 'false' &&
    import.meta.env.VITE_SINGLE_WAREHOUSE_MODE !== '0'
);

const defaultWarehouseInfo = ref<{
  _id?: string;
  code?: string;
  name?: string;
  type?: string;
}>({
  code: 'KHO-TONG',
  name: 'Kho Tổng Trường Thành',
  type: 'MAIN',
});

const isLoaded = ref<boolean>(false);
const isLoading = ref<boolean>(false);

export function useWarehouseMode() {
  const isSingleWarehouse = computed(() => isSingleWarehouseState.value);

  async function fetchWarehouseMode(): Promise<void> {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      const modeData = await warehouseService.getMode();
      if (modeData && typeof modeData.singleWarehouseMode === 'boolean') {
        isSingleWarehouseState.value = modeData.singleWarehouseMode;
      }
      if (modeData?.defaultWarehouse) {
        defaultWarehouseInfo.value = modeData.defaultWarehouse;
      }
      isLoaded.value = true;
    } catch {
      // Fallback silently to env setting on error or offline
    } finally {
      isLoading.value = false;
    }
  }

  function setSingleWarehouseMode(val: boolean) {
    isSingleWarehouseState.value = val;
  }

  return {
    isSingleWarehouse,
    defaultWarehouseInfo: computed(() => defaultWarehouseInfo.value),
    isLoaded: computed(() => isLoaded.value),
    isLoading: computed(() => isLoading.value),
    fetchWarehouseMode,
    setSingleWarehouseMode,
  };
}

export default useWarehouseMode;
