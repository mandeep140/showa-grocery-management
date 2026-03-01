require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/Auth');
const usersRoutes = require('./routes/Users');
const rolesRoutes = require('./routes/Roles');
const backupRoutes = require('./routes/Backup');
const reportsRoutes = require('./routes/Reports');
const categoriesRoutes = require('./routes/Categories');
const brandsRoutes = require('./routes/Brands');
const locationsRoutes = require('./routes/Locations');
const productsRoutes = require('./routes/Products');
const inventoryRoutes = require('./routes/Inventory');
const purchasesRoutes = require('./routes/Purchases');
const ordersRoutes = require('./routes/Orders');
const customersRoutes = require('./routes/Customers');
const sellersRoutes = require('./routes/Sellers');
const transfersRoutes = require('./routes/Transfers');
const disposalRoutes = require('./routes/Disposal');
const returnsRoutes = require('./routes/Returns');
const historyRoutes = require('./routes/History');
const printerRoutes = require('./routes/Printer');
const dataManagementRoutes = require('./routes/DataManagement');

const port = 24034;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/disposal', disposalRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/data', dataManagementRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', code: 200, message: 'Server is healthy' });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});