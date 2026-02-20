export const creditHolders = [
  { id: '1', code: 'CUST-003', name: 'Amit Singh', phone: '9876543212', due: 3200, address: '78 Civil Lines, Delhi' },
  { id: '2', code: 'CUST-007', name: 'Rajesh Kumar', phone: '9876543210', due: 1500, address: 'Sector 14, Gurgaon' },
  { id: '3', code: 'CUST-012', name: 'Sneha Gupta', phone: '9876543213', due: 500, address: 'Shastri Nagar, Jaipur' },
  { id: '4', code: 'CUST-014', name: 'Priya Sharma', phone: '9876543211', due: 0, address: 'MG Road, Pune' },
  { id: '5', code: 'CUST-020', name: 'Vikram Patel', phone: '9876543214', due: 0, address: 'Navrangpura, Ahmedabad' },
]

export const transactionHistory = {
  '1': [
    { id: 'TXN-008', date: '2026-02-15', description: 'Partial Payment', amount: 300, type: 'credit', balance: 3200 },
    { id: 'TXN-007', date: '2026-02-01', description: 'Additional Stock', amount: 1500, type: 'debit', balance: 3500 },
    { id: 'TXN-006', date: '2026-01-20', description: 'Monthly Bulk Order', amount: 2000, type: 'debit', balance: 2000 },
  ],
  '2': [{ id: 'TXN-004', date: '2026-01-31', description: 'Payment Received', amount: 400, type: 'credit', balance: 1500 }],
  '3': [{ id: 'TXN-003', date: '2026-01-10', description: 'Purchase Entry', amount: 500, type: 'debit', balance: 500 }],
  '4': [],
  '5': [],
}

export const money = (value) => `\u20B9${value.toLocaleString('en-IN')}`

export const getInitial = (name) => name.charAt(0).toUpperCase()

export const getAccent = (due) =>
  due > 0
    ? {
      amount: 'text-[#FF2E2E]',
      avatar: 'bg-[#FFF3F3] text-[#FF2E2E]',
    }
    : {
      amount: 'text-[#0EAD5A]',
      avatar: 'bg-[#F0FBF4] text-[#0EAD5A]',
    }
