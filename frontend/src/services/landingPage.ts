import api from '@/utils/api';

// BUG-02 FIX: The api interceptor already unwraps response.data.data → response.data
// So we should NOT call response.data again. Just return the response directly.
export const landingPageService = {
  async getAll() {
    const response = await api.get('/landing-pages');
    return response;
  },

  async getById(id: string) {
    const response = await api.get(`/landing-pages/${id}`);
    return response;
  },

  async getBySlug(slug: string) {
    const response = await api.get(`/landing-pages/public/${slug}`);
    return response;
  },

  async create(data: any) {
    const response = await api.post('/landing-pages', data);
    return response;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/landing-pages/${id}`, data);
    return response;
  },

  async delete(id: string) {
    const response = await api.delete(`/landing-pages/${id}`);
    return response;
  },

  async submitOrder(data: {
    landingPageId: string;
    fullName: string;
    phone: string;
    address: string;
    packageName: string;
    note?: string;
  }) {
    const response = await api.post('/landing-pages/submit-order', data);
    return response;
  },

  async generate(data: {
    title: string;
    price: number;
    originalPrice?: number;
    images: string[];
    prompt?: string;
  }) {
    const response = await api.post('/landing-pages/generate', data);
    return response;
  },
};
export default landingPageService;
