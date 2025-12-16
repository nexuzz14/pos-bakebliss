import { supabaseClient } from './supabaseClient';

export const productService = {
  // Get all products
  async getAll() {
    try {
      // Demo mode - localStorage
    //   const stored = localStorage.getItem('products');
    //   if (stored) {
    //     return JSON.parse(stored);
    //   }
      
      // Production mode - Supabase
      return await supabaseClient.query('products', {
        select: '*',
        order: 'created_at.desc'
      });
      
      // Default demo data
    //   const demoProducts = [
    //     { id: 1, name: 'Brownies Coklat', price: 25000, active: true, created_at: new Date().toISOString() },
    //     { id: 2, name: 'Kue Lapis', price: 30000, active: true, created_at: new Date().toISOString() },
    //     { id: 3, name: 'Bolu Pandan', price: 20000, active: true, created_at: new Date().toISOString() },
    //     { id: 4, name: 'Nastar', price: 35000, active: true, created_at: new Date().toISOString() },
    //     { id: 5, name: 'Kastengel', price: 40000, active: true, created_at: new Date().toISOString() },
    //     { id: 6, name: 'Putri Salju', price: 35000, active: true, created_at: new Date().toISOString() },
    //     { id: 7, name: 'Cookies Almond', price: 45000, active: true, created_at: new Date().toISOString() },
    //     { id: 8, name: 'Pie Susu', price: 15000, active: true, created_at: new Date().toISOString() },
    //   ];
      
    //   localStorage.setItem('products', JSON.stringify(demoProducts));
    //   return demoProducts;
    } catch (error) {
      console.error('Get all products error:', error);
      throw error;
    }
  },

  // Get active products only
  async getActive() {
    try {
    //   const products = await this.getAll();
    //   return products.filter(p => p.active);
      
      // Production:
      return await supabaseClient.query('products', {
        select: '*',
        filter: 'active=eq.true',
        order: 'name.asc'
      });
    } catch (error) {
      console.error('Get active products error:', error);
      throw error;
    }
  },

  // Create new product
  async create(data) {
    try {
      const products = await this.getAll();
      const newProduct = {
        id: Date.now(),
        ...data,
        created_at: new Date().toISOString()
      };
      
      const updated = [newProduct, ...products];
      localStorage.setItem('products', JSON.stringify(updated));
    //   return newProduct;
      
      // Production:
      return await supabaseClient.insert('products', data);
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },

  // Update product
  async update(id, data) {
    try {
      const products = await this.getAll();
      const updated = products.map(p => 
        p.id === id ? { ...p, ...data } : p
      );
      
      localStorage.setItem('products', JSON.stringify(updated));
    //   return updated.find(p => p.id === id);
      
      // Production:
      return await supabaseClient.update('products', id, data);
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  },

  // Soft delete product
  async softDelete(id) {
    try {
      return await this.update(id, { active: false });
    } catch (error) {
      console.error('Soft delete product error:', error);
      throw error;
    }
  },

  // Hard delete product
  async hardDelete(id) {
    try {
      const products = await this.getAll();
      const updated = products.filter(p => p.id !== id);
      localStorage.setItem('products', JSON.stringify(updated));
    //   return true;
      
      // Production:
      return await supabaseClient.delete('products', id);
    } catch (error) {
      console.error('Hard delete product error:', error);
      throw error;
    }
  }
};