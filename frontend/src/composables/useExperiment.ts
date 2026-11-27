import { ref, onMounted } from 'vue';
import api from '@/utils/api';

export function useExperiment(
  experimentKey: string,
  defaultVariantKey = 'control',
  defaultPayload: Record<string, any> = {},
) {
  const variantKey = ref<string>(defaultVariantKey);
  const variantName = ref<string>('Default');
  const payload = ref<Record<string, any>>(defaultPayload);
  const isControl = ref<boolean>(true);
  const isLoading = ref<boolean>(true);

  const getDistinctId = (): string => {
    let distinctId = localStorage.getItem('tt_distinct_id');
    if (!distinctId) {
      distinctId =
        'anon_' +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
      localStorage.setItem('tt_distinct_id', distinctId);
    }
    return distinctId;
  };

  const fetchVariant = async () => {
    try {
      isLoading.value = true;
      const distinctId = getDistinctId();
      const res = await api.get('/marketing/ab-testing/variant', {
        params: { key: experimentKey, distinctId },
      });

      if (res.data?.data) {
        const assigned = res.data.data;
        variantKey.value = assigned.variantKey || defaultVariantKey;
        variantName.value = assigned.variantName || 'Default';
        payload.value = assigned.payload || defaultPayload;
        isControl.value = assigned.isControl ?? (variantKey.value === 'control');

        // Record impression in background without blocking
        api
          .post('/marketing/ab-testing/impression', {
            experimentKey,
            variantKey: variantKey.value,
          })
          .catch(() => {});
      }
    } catch {
      // Graceful fallback to default
      variantKey.value = defaultVariantKey;
      payload.value = defaultPayload;
      isControl.value = true;
    } finally {
      isLoading.value = false;
    }
  };

  const trackConversion = async (revenue?: number) => {
    try {
      await api.post('/marketing/ab-testing/conversion', {
        experimentKey,
        variantKey: variantKey.value,
        revenue,
      });
    } catch {
      // Non-blocking
    }
  };

  onMounted(() => {
    fetchVariant();
  });

  return {
    variantKey,
    variantName,
    payload,
    isControl,
    isLoading,
    trackConversion,
    refetch: fetchVariant,
  };
}
