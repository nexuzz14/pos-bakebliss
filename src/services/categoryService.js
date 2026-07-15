import { supabaseClient } from './supabaseClient';

export const categoryService = {
  // Get all categories
  async getAll() {
    try {
      return await supabaseClient.query('categories', {
        select: '*',
        order: 'id.asc'
      });
    } catch (error) {
      console.error('Get all categories error:', error);
      throw error;
    }
  },

  // Get active categories only
  async getActive() {
    try {
      return await supabaseClient.query('categories', {
        select: '*',
        filter: 'active=eq.true',
        order: 'id.asc'
      });
    } catch (error) {
      console.error('Get active categories error:', error);
      throw error;
    }
  },

  // Create new category
  async create(data) {
    try {
      return await supabaseClient.insert('categories', {
        name: data.name,
        icon: data.icon || '🧁',
        active: data.active !== undefined ? data.active : true
      });
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  },

  // Update category
  async update(id, data) {
    try {
      return await supabaseClient.update('categories', id, data);
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  },

  // Delete category
  async delete(id) {
    try {
      return await supabaseClient.delete('categories', id);
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  }
};
