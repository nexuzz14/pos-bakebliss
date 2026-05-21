-- === 1. Buat Tabel roles ===
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Isi roles awal
INSERT INTO roles (name) VALUES ('admin'), ('cashier') ON CONFLICT DO NOTHING;

-- === 2. Buat Tabel users_profiles (extends auth.users) ===
-- Terhubung ke auth.users bawaan Supabase
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id) DEFAULT 2, -- Default 'cashier' (assumed id 2)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === 3. Buat Tabel categories ===
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Isi categories awal (opsional)
INSERT INTO categories (name) VALUES ('Makanan'), ('Minuman'), ('Dessert') ON CONFLICT DO NOTHING;

-- === 4. Buat Tabel products ===
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === 5. Buat Tabel transactions ===
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Kasir yang handle
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL,
    change_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === 6. Buat Tabel transaction_items ===
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- Snapshot nama produk saat transaksi
    price DECIMAL(10, 2) NOT NULL,      -- Snapshot harga saat transaksi
    qty INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === RLS (Row Level Security) - Opsional / Basic ===
-- Untuk pengembangan awal Anda bisa mematikan RLS, atau menyalakan RLS sederhana:

-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
-- CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Products viewable by everyone" ON products FOR SELECT USING (true);
-- CREATE POLICY "Products modifiable by authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');

-- === 7. Tabel cash_flow (Kas Masuk/Keluar) ===
CREATE TABLE cash_flow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === 8. Tabel ingredients (Bahan Baku) ===
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  stock DECIMAL(10, 3) DEFAULT 0,
  min_stock DECIMAL(10, 3) DEFAULT 0,
  price_per_unit DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

