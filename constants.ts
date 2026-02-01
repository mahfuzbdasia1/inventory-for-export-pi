import { Product, Showroom, StockItem, Sale, Category, User } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Sneakers' },
  { id: 'cat2', name: 'Formal' },
  { id: 'cat3', name: 'Casual' },
  { id: 'cat4', name: 'Boots' },
  { id: 'cat5', name: 'Sandals' },
];

export const SHOWROOMS: Showroom[] = [
  { id: 'wh', name: 'Main Warehouse', location: 'Industrial Zone' },
  { id: 'ut-1', name: 'Uttara Ba Dia Bari', location: 'Sector 4, Uttara' },
  { id: 'ban-1', name: 'Banani Outlet', location: 'Road 11, Banani' },
  { id: 'dhk-1', name: 'Dhanmondi Square', location: 'Satmasjid Road' },
];

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    username: 'admin', 
    role: 'ADMIN', 
    fullName: 'Super Admin', 
    baseSalary: 85000, 
    joiningDate: '2022-01-01', 
    status: 'ACTIVE' 
  },
  { 
    id: 'u2', 
    username: 'manager', 
    role: 'MANAGER', 
    assignedShowroomId: 'ut-1', 
    fullName: 'Branch Manager (Uttara)', 
    baseSalary: 45000, 
    joiningDate: '2022-05-15', 
    status: 'ACTIVE' 
  },
  { 
    id: 'u3', 
    username: 'seller', 
    role: 'SELLER', 
    assignedShowroomId: 'ut-1', 
    fullName: 'Senior Seller (Uttara)', 
    baseSalary: 22000, 
    joiningDate: '2023-02-10', 
    status: 'ACTIVE' 
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Air Max 270', brand: 'Nike', category: 'Sneakers', size: '10', color: 'White/Red', costPrice: 80, sellingPrice: 150 },
  { id: 'p2', name: 'Oxford Classic', brand: 'Clarks', category: 'Formal', size: '9', color: 'Brown', costPrice: 60, sellingPrice: 120 },
  { id: 'p3', name: 'Stan Smith', brand: 'Adidas', category: 'Sneakers', size: '8', color: 'Green/White', costPrice: 45, sellingPrice: 95 },
  { id: 'p4', name: 'Chelsea Boot', brand: 'Timberland', category: 'Boots', size: '11', color: 'Tan', costPrice: 110, sellingPrice: 220 },
  { id: 'p5', name: 'Yeezy Boost 350', brand: 'Adidas', category: 'Sneakers', size: '10', color: 'Black Static', costPrice: 150, sellingPrice: 300 },
];

export const MOCK_SALES: Sale[] = [
  {
    id: 's1',
    showroomId: 'ut-1',
    date: '2023-10-01T10:00:00Z',
    items: [{ productId: 'p1', quantity: 1, unitPrice: 150, costPrice: 80 }],
    totalAmount: 150,
    vat: 7.5,
    discount: 10,
    finalAmount: 147.5,
    type: 'SALE'
  },
  {
    id: 's2',
    showroomId: 'ban-1',
    date: '2023-10-02T14:30:00Z',
    items: [{ productId: 'p2', quantity: 2, unitPrice: 120, costPrice: 60 }],
    totalAmount: 240,
    vat: 12,
    discount: 0,
    finalAmount: 252,
    type: 'SALE'
  }
];

export const INITIAL_STOCK: StockItem[] = [
  { id: 'st1', productId: 'p1', showroomId: 'ut-1', quantity: 25 },
  { id: 'st2', productId: 'p1', showroomId: 'wh', quantity: 100 },
  { id: 'st3', productId: 'p2', showroomId: 'ut-1', quantity: 5 },
  { id: 'st4', productId: 'p3', showroomId: 'ban-1', quantity: 12 },
  { id: 'st5', productId: 'p4', showroomId: 'wh', quantity: 40 },
  { id: 'st6', productId: 'p5', showroomId: 'ut-1', quantity: 2 },
];