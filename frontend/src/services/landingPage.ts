import api from '@/utils/api';

export const landingPageService = {
  async getAll() {
    const response = await api.get('/landing-pages');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/landing-pages/${id}`);
    return response.data;
  },

  async getBySlug(slug: string) {
    const response = await api.get(`/landing-pages/public/${slug}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/landing-pages', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.put(`/landing-pages/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/landing-pages/${id}`);
    return response.data;
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
    return response.data;
  },

  async generate(data: {
    title: string;
    price: number;
    originalPrice?: number;
    images: string[];
    prompt?: string;
  }) {
    const response = await api.post('/landing-pages/generate', data);
    return response.data;
  },
};
export default landingPageService;
