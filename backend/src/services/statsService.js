import { readDatabase } from '../utils/fileStore.js';

export async function getDashboardStats() {
  const db = await readDatabase();
  const totalUsers = db.users.length;
  const totalOrders = db.orders.length;
  const totalRevenue = db.orders
    .filter((order) => order.status === 'paid')
    .reduce((sum, order) => sum + order.finalTotal, 0);
  const pendingVerifications = db.orders.filter((order) => order.verificationRequired).length;
  const topProducts = db.products.slice(0, 5).map((product) => {
    const paidCount = db.orders.filter((order) =>
      order.status === 'paid' && order.items.some((item) => item.productId === product.id)
    ).length;
    return {
      id: product.id,
      name: product.name,
      revenue: db.orders
        .filter((order) => order.status === 'paid')
        .reduce((sum, order) => {
          const item = order.items.find((row) => row.productId === product.id);
          return sum + (item ? item.lineTotal : 0);
        }, 0),
      paidCount
    };
  });
  return {
    totalUsers,
    totalOrders,
    totalRevenue,
    pendingVerifications,
    topProducts
  };
}
