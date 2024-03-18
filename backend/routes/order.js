const express = require('express');
const Order = require('../models/Order');
const Table = require('../models/Table');
const Section = require('../models/Section');
const router = express.Router();
const moment = require('moment');
const mongoose = require('mongoose')
const Menu = require('../models/Menu');
const Item = require('../models/Item');


// router.post('/order/:tableId', async (req, res) => {
//   try {
//     const { tableId } = req.params;
//     const { items = [], subtotal, CGST, SGST, total, isTemporary, acPercentageAmount, isPrint } = req.body;

//     const modifiedItems = items.map(item => ({
//       ...item,
//       taste: item.taste || '', // Set the taste information, or default to an empty string
//     }));


//     const currentDate = new Date();
//     console.log(currentDate)

//     // If the current time is before 6 AM, set the order date to yesterday
//     if (currentDate.getHours() >= '3:0:0') {
//       currentDate.setDate(currentDate.getDate() + 1);
//     }

//     // Set the date to yesterday
//     const previousDate = new Date(currentDate);
//     previousDate.setDate(previousDate.getDate() - 1);
    
//     // Adjust the time to be 5.5 hours ahead
//     previousDate.setHours(previousDate.getHours() + 5); // Add 5 hours
//     previousDate.setMinutes(previousDate.getMinutes() + 30); // Add 30 minutes


//     // Process each item in the order
//     for (const item of modifiedItems) {
//       // Update stock quantity for Items
//       const stockItem = await Item.findOne({ itemName: item.name });

//       if (!stockItem) {
//         console.warn(`Item ${item.name} not found in stock. Continuing with order processing.`);
//       } else {
//         // Check if there's sufficient stock for the item
//         if (stockItem.stockQty < item.quantity) {
//           return res.status(400).json({ error: `Insufficient stock for item ${item.name}` });
//         }

//         // Decrease the stock quantity for Items
//         stockItem.stockQty -= item.quantity;
//         await stockItem.save();

//         // Add stockQty to the item for response
//         item.stockQty = stockItem.stockQty;
//       }

//       // Update stock quantity for Menus
//       const menu = await Menu.findOne({ name: item.name });
//       if (menu) {
//         // Check if there's sufficient stock for the menu
//         if (menu.stockQty < item.quantity) {
//           console.warn(`Insufficient stock for menu ${item.name}. Order will still be processed.`);
//         } else {
//           // Decrease the stock quantity for Menus
//           menu.stockQty -= item.quantity;
//           await menu.save();
//         }
//       } else {
//         console.warn(`Menu ${item.name} not found. Continuing with order processing.`);
//       }
//     }

//     // Create a new order
//     const newOrder = new Order({
//       tableId,
//       items: modifiedItems,
//       subtotal,
//       CGST,
//       SGST,
//       acPercentageAmount,
//       total,
//       isTemporary: isTemporary !== undefined ? isTemporary : true,
//       isPrint,
//       createdAt: previousDate,
//       orderDate: previousDate,
//     });

//     // Save the order
//     const savedOrder = await newOrder.save();

//     res.json(savedOrder);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

router.post('/order/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { items = [], subtotal, CGST, SGST, total, isTemporary, acPercentageAmount, isPrint } = req.body;

    const modifiedItems = items.map(item => ({
      ...item,
      taste: item.taste || '', // Set the taste information, or default to an empty string
    }));


    const currentDate = new Date();


    // If the current time is before 6 AM, set the order date to yesterday
    if (currentDate.getHours() >= 3) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Set the date to yesterday
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);

    // Adjust the time to be 5.5 hours ahead
    previousDate.setHours(previousDate.getHours() + 5); // Add 5 hours
    previousDate.setMinutes(previousDate.getMinutes() + 30); // Add 30 minutes


    // Process each item in the order
    for (const item of modifiedItems) {
      // Update stock quantity for Items
      const stockItem = await Item.findOne({ itemName: item.name });

      if (!stockItem) {
        console.warn(`Item ${item.name} not found in stock. Continuing with order processing.`);
      } else {
        // Check if there's sufficient stock for the item
        if (stockItem.stockQty < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for item ${item.name}` });
        }

        // Decrease the stock quantity for Items
        stockItem.stockQty -= item.quantity;
        await stockItem.save();

        // Add stockQty to the item for response
        item.stockQty = stockItem.stockQty;
      }

      // Update stock quantity for Menus
      const menu = await Menu.findOne({ name: item.name });
      if (menu) {
        // Check if there's sufficient stock for the menu
        if (menu.stockQty < item.quantity) {
          console.warn(`Insufficient stock for menu ${item.name}. Order will still be processed.`);
        } else {
          // Decrease the stock quantity for Menus
          menu.stockQty -= item.quantity;
          await menu.save();
        }
      } else {
        console.warn(`Menu ${item.name} not found. Continuing with order processing.`);
      }
    }

    // Create a new order
    const newOrder = new Order({
      tableId,
      items: modifiedItems,
      subtotal,
      CGST,
      SGST,
      acPercentageAmount,
      total,
      isTemporary: isTemporary !== undefined ? isTemporary : true,
      isPrint,
      createdAt: previousDate,
      orderDate: previousDate,
    });

    // Save the order
    const savedOrder = await newOrder.save();

    res.json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/itemsWithSameNameAndMenu', async (req, res) => {
  try {
    // Fetch items and menus with matching names
    const result = await Item.aggregate([
      {
        $lookup: {
          from: 'menus', // The name of your menus collection
          localField: 'itemName',
          foreignField: 'name',
          as: 'matchingMenu',
        },
      },
      {
        $match: {
          matchingMenu: { $ne: [] },
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





// router.patch('/order/update-order-by-table/:tableId', async (req, res) => {
router.patch('/order/update-order-by-table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { items = [], subtotal, CGST, SGST, total, isTemporary, isPrint } = req.body;

    const modifiedItems = items.map(item => ({
      ...item,
      taste: item.taste || '', // Set the taste information, or default to an empty string
    }));

    // Check and update stock quantity
    for (const item of modifiedItems) {
      const stockItem = await Item.findOne({ itemName: item.name });

      if (!stockItem) {
        console.warn(`Item ${item.name} not found in stock. Continuing with order update.`);
      } else {
        // Check if there's sufficient stock for the item
        if (stockItem.stockQty < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for item ${item.name}` });
        }

        // Decrease the stock quantity for Items
        stockItem.stockQty -= item.quantity;
        await stockItem.save();

        // Add stockQty to the item for response
        item.stockQty = stockItem.stockQty;
      }
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { tableId: tableId },
      {
        items: modifiedItems,
        subtotal,
        CGST,
        SGST,
        total,
        isTemporary,
        isPrint
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// updated api
router.patch('/update-order-by-id/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items = [], subtotal, CGST, SGST, total, isTemporary, acPercentageAmount, isPrint, cashAmount, onlinePaymentAmount, dueAmount, complimentaryAmount, discount } = req.body;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    const modifiedItems = items.map(item => ({
      ...item,
      taste: '', // Set the taste information based on your requirements
    }));

    // Check and update stock quantity
    for (const item of modifiedItems) {
      const stockItem = await Item.findOne({ itemName: item.name });

      if (!stockItem) {
        console.warn(`Item ${item.name} not found in stock. Continuing with order update.`);
      } else {
        // Check if there's sufficient stock for the item
        if (stockItem.stockQty < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for item ${item.name}` });
        }

        // Decrease the stock quantity for Items
        stockItem.stockQty -= item.quantity;
        await stockItem.save();

        // Add stockQty to the item for response
        item.stockQty = stockItem.stockQty;
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        items: modifiedItems,
        subtotal,
        CGST,
        SGST,
        total,
        isTemporary,
        isPrint,
        acPercentageAmount,
        cashAmount,
        onlinePaymentAmount,
        dueAmount,
        complimentaryAmount,
        discount,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// edit api
// router.patch('/update-order-by-number/:orderNumber', async (req, res) => {
//   try {
//     const { orderNumber } = req.params;
//     const updatedOrderData = req.body; // Assuming the updated data is sent in the request body

//     // Find the order based on the order number
//     const order = await Order.findOne({ orderNumber });

//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     // Update the order with the new data
//     const updatedOrder = await Order.findOneAndUpdate(
//       { orderNumber },
//       { $set: updatedOrderData },
//       { new: true } // Return the modified document
//     );

//     res.json(updatedOrder);
//   } catch (error) {
//     console.error('Error updating order:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

//running
// router.patch('/update-order-by-number/:orderNumber', async (req, res) => {
//   try {
//     const { orderNumber } = req.params;
//     const updatedOrderData = req.body; // Assuming the updated data is sent in the request body

//     // Find the order based on the order number
//     const order = await Order.findOne({ orderNumber });

//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     // Calculate the difference in quantity for each item between the old order and the updated order
//     const oldItems = order.items;
//     const newItems = updatedOrderData.items;

//     for (let i = 0; i < oldItems.length; i++) {
//       const oldItem = oldItems[i];
//       const newItem = newItems.find(item => item.name === oldItem.name);

//       if (newItem) {
//         const quantityDifference = newItem.quantity - oldItem.quantity;

//         // Update stock quantity for items
//         const stockItem = await Item.findOne({ itemName: oldItem.name });

//         if (stockItem) {
//           stockItem.stockQty -= quantityDifference;
//           await stockItem.save();
//         }

//         // Update stock quantity for menus if necessary
//         const menu = await Menu.findOne({ name: oldItem.name });
//         if (menu) {
//           menu.stockQty -= quantityDifference;
//           await menu.save();
//         }
//       }
//     }

//     // Update the order with the new data
//     const updatedOrder = await Order.findOneAndUpdate(
//       { orderNumber },
//       { $set: updatedOrderData },
//       { new: true } // Return the modified document
//     );

//     res.json(updatedOrder);
//   } catch (error) {
//     console.error('Error updating order:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });



router.patch('/update-order-by-number/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const updatedOrderData = req.body;

    // Find the order based on the order number
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Calculate the difference in quantity for each item between the old order and the updated order
    const oldItems = order.items;
    const newItems = updatedOrderData.items;

    for (const oldItem of oldItems) {
      const newItem = newItems.find(item => item.name === oldItem.name);

      if (newItem) {
        const quantityDifference = newItem.quantity - oldItem.quantity;

        // Update stock quantity for items
        const stockItem = await Item.findOne({ itemName: oldItem.name });

        if (stockItem) {
          stockItem.stockQty -= quantityDifference;
          await stockItem.save();
        }

        // Update stock quantity for menus if necessary
        const menu = await Menu.findOne({ name: oldItem.name });
        if (menu) {
          menu.stockQty -= quantityDifference;
          await menu.save();
        }
      }
    }

    // Handle newly added items
    for (const newItem of newItems) {
      if (!oldItems.find(item => item.name === newItem.name)) {
        // This item is newly added, update its stock quantity
        const stockItem = await Item.findOne({ itemName: newItem.name });

        if (stockItem) {
          stockItem.stockQty -= newItem.quantity;
          await stockItem.save();
        }

        // Update stock quantity for menus if necessary
        const menu = await Menu.findOne({ name: newItem.name });
        if (menu) {
          menu.stockQty -= newItem.quantity;
          await menu.save();
        }
      }
    }

    // Update the order with the new data
    const updatedOrder = await Order.findOneAndUpdate(
      { orderNumber },
      { $set: updatedOrderData },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.delete('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await Order.findByIdAndRemove(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();

    if (!orders) {
      return res.status(404).json({ error: 'Orders not found' });
    }

    const ordersWithTableNames = await Promise.all(
      orders.map(async (order) => {
        const table = await Table.findById(order.tableId);
        return {
          ...order.toObject(),
          tableName: table ? table.tableName : 'Unknown Table',
        };
      })
    );

    res.json(ordersWithTableNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// routes/order.js
router.get('/order/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;

    // Filter bills with isTemporary: true
    const temporaryBills = await Order.find({ tableId, isTemporary: true }).sort({ createdAt: -1 });

    res.json(temporaryBills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/orders/date', async (req, res) => {
  try {
    // Default to the current date
    let startDate = moment().startOf('day');
    let endDate = moment().endOf('day');

    // If start and end dates are provided in the query parameters, use them
    if (req.query.startDate && req.query.endDate) {
      startDate = moment(req.query.startDate).startOf('day');
      endDate = moment(req.query.endDate).endOf('day');
    }

    // Find orders within the date range
    const orders = await Order.find({
      isPrint: 0,
      isTemporary: false,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    console.log(orders)
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Update the /menu-statistics endpoint in your Express router
// router.get('/menu-statistics', async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     // Create a filter based on the date range
//     const dateFilter = {};
//     if (startDate && endDate) {
//       dateFilter.orderDate = {
//         $gte: new Date(startDate),
//         $lt: new Date(endDate + 'T23:59:59.999Z'),
//       };
//     } else if (startDate) {
//       dateFilter.orderDate = { $gte: new Date(startDate) };
//     } else if (endDate) {
//       dateFilter.orderDate = { $lt: new Date(endDate + 'T23:59:59.999Z') };
//     }

//     // Find orders based on the date filter
//     const allOrders = await Order.find(dateFilter);

//     // Fetch menu prices
//     const menuPrices = await Menu.find({}, { name: 1, price: 1 });

//     // Create a map of menu prices for efficient lookup
//     const menuPricesMap = menuPrices.reduce((acc, menu) => {
//       acc[menu.name] = menu.price;
//       return acc;
//     }, {});

//     // Calculate menu statistics with orderDate
//     const menuStatistics = {};
//     allOrders.forEach((order) => {
//       order.items.forEach((item) => {
//         const { name, quantity } = item;

//         // Fetch the price from the menuPricesMap
//         const price = menuPricesMap[name] || 0;

//         // Update menu statistics
//         if (!menuStatistics[name]) {
//           menuStatistics[name] = {
//             count: 1,
//             totalQuantity: quantity,
//             totalPrice: price * quantity,
//             price, // Include the 'price' field
//           };
//         } else {
//           menuStatistics[name].count += 1;
//           menuStatistics[name].totalQuantity += quantity;
//           menuStatistics[name].totalPrice += price * quantity;
//         }
//       });
//     });

//     res.json({ menuStatistics });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

router.get('/menu-statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Create a filter based on the date range
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.orderDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate + 'T23:59:59.999Z'),
      };
    } else if (startDate) {
      dateFilter.orderDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.orderDate = { $lt: new Date(endDate + 'T23:59:59.999Z') };
    }

    // Find orders based on the date filter
    const allOrders = await Order.find(dateFilter);

    // Initialize menuStatistics object
    const menuStatistics = {};

    // Iterate over each order
    allOrders.forEach((order) => {
      // Iterate over each item in the order
      order.items.forEach((item) => {
        // Check if the item is not canceled
        if (!item.isCanceled) {
          const { name, quantity } = item;

          // Update menu statistics for the item
          if (!menuStatistics[name]) {
            menuStatistics[name] = {
              count: 1,
              totalQuantity: quantity,
              totalPrice: item.price * quantity,
              price: item.price,
            };
          } else {
            menuStatistics[name].count++;
            menuStatistics[name].totalQuantity += quantity;
            menuStatistics[name].totalPrice += item.price * quantity;
          }
        }
      });
    });

    res.json({ menuStatistics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/get/order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Check if the orderNumber is provided
    if (!orderNumber) {
      return res.status(400).json({ error: 'Invalid Order Number' });
    }

    // Find the order based on the orderNumber
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to fetch the order based on the table ID
router.get('/orders/:tableId', async (req, res) => {
  try {
    const tableId = req.params.tableId;

    // Assuming the order is uniquely identified by the table ID
    const order = await Order.findOne({ tableId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add this route at the end of your existing code
router.get('/latest-orders', async (req, res) => {
  try {
    // Fetch the latest 10 orders based on the _id field in descending order
    const isPrintValues = [0, 1]; // Possible values for isPrint

    const latestOrders = await Order.find({ isPrint: { $in: isPrintValues } })
      .sort({ _id: -1 }) // Sort by _id instead of createdAt
      .limit();

    if (!latestOrders || latestOrders.length === 0) {
      return res.status(404).json({ error: 'No orders found' });
    }

    res.json(latestOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/orders/list/menuwise', async (req, res) => {
  try {
    const { date, menuName } = req.query;

    // Convert the date string to a Date object
    const selectedDate = new Date(date);

    // Find orders for the given date and menu name
    const orders = await Order.find({
      'orderDate': { $gte: selectedDate, $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000) }, // Considering orders within the same day
      'items.name': menuName
    });

    // Calculate menu counts and quantities
    let menuCounts = 0;
    let totalQuantity = 0;
    let totalPrice = 0;


    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.name === menuName) {
          menuCounts++;
          totalQuantity += item.quantity;
          totalPrice += item.price * item.quantity;

        }
      });
    });

    res.json({ menuCounts, totalQuantity, totalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/get-next-order-number', async (req, res) => {
  try {
    // Get the total count of documents in the collection
    const totalCount = await Order.countDocuments();

    // Generate the next order number based on the total count
    const nextOrderNumber = `${totalCount + 1}`;

    res.json({ nextOrderNumber });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Active Tables
router.get('/temporary-orders-count', async (req, res) => {
  try {
    const temporaryOrdersCount = await Order.countDocuments({ isTemporary: true });

    res.json({ temporaryOrdersCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/total-amount-for-current-date', async (req, res) => {
  try {
    const currentDate = moment().startOf('day'); // Get the start of the current date
    const nextDate = moment(currentDate).add(1, 'days'); // Get the start of the next date

    const totalForCurrentDate = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: currentDate.toDate(),
            $lt: nextDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }, // Replace 'totalAmount' with the actual field you want to sum
        },
      },
    ]);

    // If there are no orders for the current date, set totalAmount to 0
    const result = totalForCurrentDate.length > 0 ? totalForCurrentDate[0].total : 0;

    res.json({ totalForCurrentDate: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Previous month Sales
router.get('/total-amount-for-previous-month', async (req, res) => {
  try {
    const startDate = moment().subtract(1, 'months').startOf('month'); // Get the start of the previous month
    const endDate = moment().startOf('month'); // Get the start of the current month

    const totalForPreviousMonth = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate.toDate(),
            $lt: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }, // Replace 'total' with the actual field you want to sum
        },
      },
    ]);

    // If there are no orders for the previous month, set total to 0
    const result = totalForPreviousMonth.length > 0 ? totalForPreviousMonth[0].total : 0;

    res.json({ totalForPreviousMonth: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/total-amounts-by-month', async (req, res) => {
  try {
    const currentYear = moment().year();
    const startOfYear = moment().startOf('year');

    const totalAmountsByMonth = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear.toDate(),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          total: { $sum: '$total' },
        },
      },
    ]);

    // Format the result to include month-wise total amounts
    const formattedResult = [];
    for (let month = 1; month <= 12; month++) {
      const totalForMonth = totalAmountsByMonth.find(entry => entry._id === month);
      const totalAmount = totalForMonth ? totalForMonth.total : 0;
      formattedResult.push({ month, totalAmount });
    }

    res.json({ totalAmountsByMonth: formattedResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// donut api
router.get('/summary', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const orders = await Order.find({
      orderDate: { $gte: today },
    });

    const summary = {
      cashAmount: 0,
      dueAmount: 0,
      onlinePaymentAmount: 0,
      complimentaryAmount: 0,
      discount: 0,
    };

    orders.forEach((order) => {
      summary.cashAmount += parseFloat(order.cashAmount);
      summary.dueAmount += parseFloat(order.dueAmount);
      summary.onlinePaymentAmount += parseFloat(order.onlinePaymentAmount);
      summary.complimentaryAmount += parseFloat(order.complimentaryAmount);
      summary.discount += parseFloat(order.discount);
    });

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// router.get('/savedBills/:tableId', async (req, res) => {
//   try {
//     const { tableId } = req.params;

//     // Fetch saved bills for the table with the given tableId
//     const savedBills = await Order.find({ tableId, isTemporary: true, isPrint: 0 }).sort({ createdAt: -1 });

//     res.json(savedBills);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

router.get('/savedBills/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;

    // Fetch saved bills for the table with the given tableId
    const savedBills = await Order.aggregate([
      { $match: { tableId, isTemporary: true, isPrint: 0 } },
      { $unwind: "$items" },
      { $match: { "items.isCanceled": false } },
      {
        $group: {
          _id: "$_id",
          tableId: { $first: "$tableId" },
          items: { $push: "$items" },
          subtotal: { $first: "$subtotal" },
          CGST: { $first: "$CGST" },
          SGST: { $first: "$SGST" },
          total: { $first: "$total" },
          isTemporary: { $first: "$isTemporary" },
          orderDate: { $first: "$orderDate" },
          acPercentageAmount: { $first: "$acPercentageAmount" },
          isPrint: { $first: "$isPrint" },
          createdAt: { $first: "$createdAt" },
          orderNumber: { $first: "$orderNumber" },
          __v: { $first: "$__v" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Map through the savedBills array to remove the _id field
    const formattedBills = savedBills.map(bill => {
      const { _id, ...rest } = bill;
      return rest;
    });

    res.json(formattedBills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports = router