
export type UserRole = 'ADMIN' | 'MANAGER' | 'SELLER';

export interface StaffRole {
  id: string;
  name: string;
  accessLevel: UserRole;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole; // Internal system access level
  roleId?: string; // Link to dynamic StaffRole
  assignedShowroomId?: string;
  fullName: string;
  phoneNumber?: string;
  baseSalary: number;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SalaryPayment {
  id: string;
  userId: string;
  showroomId: string;
  basicSalary: number;
  amount: number; // Net Paid Amount
  month: string; // e.g., "October 2023"
  datePaid: string;
  bonus: number;
  deduction: number;
  note?: string;
  status: 'Paid' | 'Unpaid';
}

export interface Category {
  id: string;
  name: string;
}

export interface Showroom {
  id: string;
  name: string;
  location: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
}

export interface StockItem {
  id: string;
  productId: string;
  showroomId: string;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
}

export interface Sale {
  id: string;
  showroomId: string;
  items: SaleItem[];
  totalAmount: number;
  vat: number;
  discount: number;
  finalAmount: number;
  date: string;
  type: 'SALE' | 'RETURN';
  isReturned?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
}

export type ExpenseCategory = 'Conveyance' | 'Rent' | 'Electricity' | 'Snacks' | 'Utility' | 'Salary' | 'Miscellaneous';

export interface Expense {
  id: string;
  showroomId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCOGS: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
}
