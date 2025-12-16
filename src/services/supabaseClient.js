const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabaseClient = {
  async query(table, options = {}) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${table}`;
      
      if (options.select) {
        url += `?select=${options.select}`;
      }
      
      if (options.filter) {
        url += (url.includes('?') ? '&' : '?') + options.filter;
      }
      
      if (options.order) {
        url += (url.includes('?') ? '&' : '?') + `order=${options.order}`;
      }
      
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      
      if (!res.ok) throw new Error('Query failed');
      return await res.json();
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  },
  
  async insert(table, data) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Insert failed');
      const result = await res.json();
      return result[0];
    } catch (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
  },
  
  async update(table, id, data) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Update failed');
      const result = await res.json();
      return result[0];
    } catch (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
  },
  
  async delete(table, id) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      
      if (!res.ok) throw new Error('Delete failed');
      return true;
    } catch (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  }
};