const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');


// ─────────────────────────────────────────
// GET /api/reports/inventory
// Full inventory status
// ─────────────────────────────────────────
router.get('/inventory', verifyToken, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.id,
        p.sku,
        p.product_name,
        p.category,
        p.current_stock,
        p.reorder_level,
        p.selling_price,
        p.expiry_date,
        s.supplier_name,
        CASE 
          WHEN p.current_stock <= p.reorder_level THEN 'LOW STOCK'
          ELSE 'OK'
        END AS stock_status
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.current_stock ASC
    `);

    res.json({
      total_products: products.length,
      products: products
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// GET /api/reports/lowstock
// Only products that need reorder
// ─────────────────────────────────────────
router.get('/lowstock', verifyToken, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.id,
        p.product_name,
        p.category,
        p.current_stock,
        p.reorder_level,
        s.supplier_name,
        s.phone AS supplier_phone
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock <= p.reorder_level
      ORDER BY p.current_stock ASC
    `);

    res.json({
      total_low_stock_items: products.length,
      items: products
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// GET /api/reports/sales
// Sales summary report
// ─────────────────────────────────────────
router.get('/sales', verifyToken, async (req, res) => {
  try {

    // Overall sales summary
    const [summary] = await db.query(`
      SELECT 
        COUNT(*) AS total_transactions,
        SUM(quantity) AS total_items_sold,
        SUM(total_price) AS total_revenue
      FROM sales
    `);

    // Sales by product
    const [byProduct] = await db.query(`
      SELECT 
        p.product_name,
        SUM(s.quantity) AS total_sold,
        SUM(s.total_price) AS total_revenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY p.product_name
      ORDER BY total_sold DESC
    `);

    // Recent 10 sales
    const [recent] = await db.query(`
      SELECT 
        s.id,
        p.product_name,
        s.quantity,
        s.total_price,
        s.sale_date,
        u.username AS sold_by
      FROM sales s
      JOIN products p ON s.product_id = p.id
      JOIN users u ON s.user_id = u.id
      ORDER BY s.sale_date DESC
      LIMIT 10
    `);

    res.json({
      summary: summary[0],
      sales_by_product: byProduct,
      recent_sales: recent
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// GET /api/reports/purchases
// Purchase summary report
// ─────────────────────────────────────────
router.get('/purchases', verifyToken, async (req, res) => {
  try {

    // Overall purchase summary
    const [summary] = await db.query(`
      SELECT 
        COUNT(*) AS total_transactions,
        SUM(quantity) AS total_items_purchased,
        SUM(cost_at_purchase * quantity) AS total_spent
      FROM purchases
    `);

    // Recent 10 purchases
    const [recent] = await db.query(`
      SELECT 
        pu.id,
        p.product_name,
        s.supplier_name,
        pu.quantity,
        pu.cost_at_purchase,
        pu.purchase_date
      FROM purchases pu
      JOIN products p ON pu.product_id = p.id
      JOIN suppliers s ON pu.supplier_id = s.id
      ORDER BY pu.purchase_date DESC
      LIMIT 10
    `);

    res.json({
      summary: summary[0],
      recent_purchases: recent
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ─────────────────────────────────────────
// GET /api/reports/dashboard
// Summary numbers for dashboard
// ─────────────────────────────────────────
router.get('/dashboard', verifyToken, async (req, res) => {
  try {

    // Total products
    const [products] = await db.query(
      'SELECT COUNT(*) AS total FROM products'
    );

    // Low stock count
    const [lowStock] = await db.query(
      'SELECT COUNT(*) AS total FROM products WHERE current_stock <= reorder_level'
    );

    // Total sales today
    const [todaySales] = await db.query(`
      SELECT 
        COUNT(*) AS transactions,
        COALESCE(SUM(total_price), 0) AS revenue
      FROM sales 
      WHERE DATE(sale_date) = CURDATE()
    `);

    // Total inventory value
    const [inventoryValue] = await db.query(`
      SELECT 
        COALESCE(SUM(current_stock * selling_price), 0) AS total_value
      FROM products
    `);

    res.json({
      total_products: products[0].total,
      low_stock_alerts: lowStock[0].total,
      todays_sales: todaySales[0],
      inventory_value: inventoryValue[0].total_value
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PDFDocument = require('pdfkit');

// ─────────────────────────────────────────
// GET /api/reports/pdf
// Generate PDF report (Admin + Manager only)
// Query params: type, limit, fromDate, toDate
// ─────────────────────────────────────────
router.get('/pdf', verifyToken, async (req, res) => {

  // Block Staff
  if (req.user.role === 'Staff') {
    return res.status(403).json({ message: 'Access denied. Admins and Managers only.' });
  }

  const { type = 'sales', limit = 20, fromDate, toDate } = req.query;
  const validTypes = ['sales', 'purchases', 'inventory'];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid report type.' });
  }

  try {
    let records = [];
    let summary = {};
    let title   = '';

    // ── Build date filter ──
    const dateFilter = (col) => {
      let clause = '';
      const params = [];
      if (fromDate) { clause += ` AND DATE(${col}) >= ?`; params.push(fromDate); }
      if (toDate)   { clause += ` AND DATE(${col}) <= ?`; params.push(toDate); }
      return { clause, params };
    };

    // ── Sales ──
    if (type === 'sales') {
      title = 'Sales Report';
      const df = dateFilter('s.sale_date');

      const [rows] = await db.query(`
        SELECT 
          s.id,
          p.product_name,
          s.quantity,
          s.total_price,
          u.username AS sold_by,
          DATE_FORMAT(s.sale_date, '%d-%m-%Y %H:%i') AS sale_date
        FROM sales s
        JOIN products p ON s.product_id = p.id
        JOIN users    u ON s.user_id    = u.id
        WHERE 1=1 ${df.clause}
        ORDER BY s.sale_date DESC
        LIMIT ?
      `, [...df.params, Number(limit)]);

      records = rows;
      const totalRevenue = rows.reduce((sum, r) => sum + Number(r.total_price), 0);
      const totalItems   = rows.reduce((sum, r) => sum + Number(r.quantity), 0);
      summary = {
        'Total Transactions': rows.length,
        'Total Items Sold':   totalItems,
        'Total Revenue':      `Rs. ${totalRevenue.toFixed(2)}`,
      };
    }

    // ── Purchases ──
    else if (type === 'purchases') {
      title = 'Purchase Report';
      const df = dateFilter('pu.purchase_date');

      const [rows] = await db.query(`
        SELECT
          pu.id,
          p.product_name,
          s.supplier_name,
          pu.quantity,
          pu.cost_at_purchase,
          (pu.quantity * pu.cost_at_purchase) AS total_cost,
          DATE_FORMAT(pu.purchase_date, '%d-%m-%Y %H:%i') AS purchase_date
        FROM purchases pu
        JOIN products  p ON pu.product_id  = p.id
        JOIN suppliers s ON pu.supplier_id = s.id
        WHERE 1=1 ${df.clause}
        ORDER BY pu.purchase_date DESC
        LIMIT ?
      `, [...df.params, Number(limit)]);

      records = rows;
      const totalSpent = rows.reduce((sum, r) => sum + Number(r.total_cost), 0);
      const totalItems = rows.reduce((sum, r) => sum + Number(r.quantity), 0);
      summary = {
        'Total Purchases':       rows.length,
        'Total Items Received':  totalItems,
        'Total Amount Spent':    `Rs. ${totalSpent.toFixed(2)}`,
      };
    }

    // ── Inventory ──
    else if (type === 'inventory') {
      title = 'Inventory Report';

      const [rows] = await db.query(`
        SELECT
          p.sku,
          p.product_name,
          p.category,
          p.current_stock,
          p.reorder_level,
          p.selling_price,
          p.expiry_date,
          s.supplier_name,
          CASE WHEN p.current_stock <= p.reorder_level THEN 'LOW' ELSE 'OK' END AS status
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.current_stock ASC
        LIMIT ?
      `, [Number(limit)]);

      records = rows;
      const lowCount = rows.filter(r => r.status === 'LOW').length;
      const totalVal = rows.reduce((sum, r) => sum + (Number(r.current_stock) * Number(r.selling_price)), 0);
      summary = {
        'Total Products':    rows.length,
        'Low Stock Items':   lowCount,
        'Inventory Value':   `Rs. ${totalVal.toFixed(2)}`,
      };
    }

    // ────────────────────────────────────────
    // Build PDF
    // ────────────────────────────────────────
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${type}-report.pdf"`);
    doc.pipe(res);

    // ── Color palette ──
    const C = {
      dark:    '#0d0f14',
      accent:  '#f59e0b',
      white:   '#ffffff',
      light:   '#f8fafc',
      muted:   '#64748b',
      border:  '#e2e8f0',
      good:    '#16a34a',
      bad:     '#dc2626',
    };

    const PAGE_W = doc.page.width  - 80;  // usable width
    const LEFT   = 40;

    // ── Header bar ──
    doc.rect(0, 0, doc.page.width, 70).fill(C.dark);
    doc.fontSize(20).fillColor(C.accent).font('Helvetica-Bold')
       .text('RSIMS', LEFT, 18);
    doc.fontSize(9).fillColor('#94a3b8').font('Helvetica')
       .text('Retail Store Inventory Management System', LEFT, 42);

    // Report type label on right
    doc.fontSize(11).fillColor(C.white).font('Helvetica-Bold')
       .text(title.toUpperCase(), 0, 26, { align: 'right', width: doc.page.width - 40 });

    // ── Meta info ──
    doc.moveDown(3);
    const metaY = 90;
    doc.fontSize(9).fillColor(C.muted).font('Helvetica')
       .text(`Generated by: ${req.user.username} (${req.user.role})`, LEFT, metaY)
       .text(`Generated at: ${new Date().toLocaleString('en-IN')}`,   LEFT, metaY + 14)
       .text(`Record limit: Last ${limit} records${fromDate ? ' | From: ' + fromDate : ''}${toDate ? ' | To: ' + toDate : ''}`, LEFT, metaY + 28);

    // Divider
    doc.moveTo(LEFT, 130).lineTo(LEFT + PAGE_W, 130).strokeColor(C.border).lineWidth(1).stroke();

    // ── Summary box ──
    const sumKeys = Object.keys(summary);
    const boxW    = PAGE_W / sumKeys.length;
    let   boxX    = LEFT;

    doc.rect(LEFT, 138, PAGE_W, 48).fill('#f1f5f9');

    sumKeys.forEach(key => {
      doc.fontSize(7).fillColor(C.muted).font('Helvetica')
         .text(key.toUpperCase(), boxX + 8, 145, { width: boxW - 16 });
      doc.fontSize(12).fillColor(C.dark).font('Helvetica-Bold')
         .text(summary[key], boxX + 8, 156, { width: boxW - 16 });
      boxX += boxW;
    });

    // ── Table ──
    const tableTop = 200;

    // Column config per type
    const COLS = {
      sales: [
        { key: 'id',           label: '#',        w: 30  },
        { key: 'product_name', label: 'Product',   w: 140 },
        { key: 'quantity',     label: 'Qty',       w: 40  },
        { key: 'total_price',  label: 'Amount',    w: 70  },
        { key: 'sold_by',      label: 'Staff',     w: 70  },
        { key: 'sale_date',    label: 'Date',      w: 115 },
      ],
      purchases: [
        { key: 'id',              label: '#',         w: 30  },
        { key: 'product_name',    label: 'Product',   w: 120 },
        { key: 'supplier_name',   label: 'Supplier',  w: 100 },
        { key: 'quantity',        label: 'Qty',       w: 40  },
        { key: 'cost_at_purchase',label: 'Cost/Unit', w: 65  },
        { key: 'total_cost',      label: 'Total',     w: 65  },
        { key: 'purchase_date',   label: 'Date',      w: 95  },
      ],
      inventory: [
        { key: 'product_name',  label: 'Product',   w: 130 },
        { key: 'category',      label: 'Category',  w: 80  },
        { key: 'current_stock', label: 'Stock',     w: 50  },
        { key: 'reorder_level', label: 'Reorder',   w: 55  },
        { key: 'selling_price', label: 'Price',     w: 60  },
        { key: 'supplier_name', label: 'Supplier',  w: 100 },
        { key: 'status',        label: 'Status',    w: 40  },
      ],
    };

    const cols = COLS[type];

    // Table header row
    let curX = LEFT;
    doc.rect(LEFT, tableTop, PAGE_W, 22).fill(C.dark);
    cols.forEach(col => {
      doc.fontSize(7).fillColor(C.white).font('Helvetica-Bold')
         .text(col.label, curX + 4, tableTop + 7, { width: col.w - 8 });
      curX += col.w;
    });

    // Table rows
    let curY   = tableTop + 22;
    let rowNum = 0;

    records.forEach(row => {
      // Page break check
      if (curY > doc.page.height - 80) {
        doc.addPage();
        curY = 40;
        // Reprint header on new page
        curX = LEFT;
        doc.rect(LEFT, curY, PAGE_W, 22).fill(C.dark);
        cols.forEach(col => {
          doc.fontSize(7).fillColor(C.white).font('Helvetica-Bold')
             .text(col.label, curX + 4, curY + 7, { width: col.w - 8 });
          curX += col.w;
        });
        curY += 22;
      }

      const rowH  = 20;
      const rowBg = rowNum % 2 === 0 ? C.white : '#f8fafc';
      doc.rect(LEFT, curY, PAGE_W, rowH).fill(rowBg);

      curX = LEFT;
      cols.forEach(col => {
        let val = row[col.key] ?? '—';

        // Format currency fields
        if (['total_price', 'cost_at_purchase', 'total_cost', 'selling_price'].includes(col.key)) {
          val = `Rs.${Number(val).toFixed(2)}`;
        }

        // Color status field
        let textColor = C.dark;
        if (col.key === 'status') {
          textColor = val === 'LOW' ? C.bad : C.good;
        }

        doc.fontSize(7.5).fillColor(textColor).font('Helvetica')
           .text(String(val), curX + 4, curY + 6, { width: col.w - 8, ellipsis: true });

        // Column divider
        doc.moveTo(curX + col.w, curY)
           .lineTo(curX + col.w, curY + rowH)
           .strokeColor(C.border).lineWidth(0.3).stroke();

        curX += col.w;
      });

      // Row bottom border
      doc.moveTo(LEFT, curY + rowH).lineTo(LEFT + PAGE_W, curY + rowH)
         .strokeColor(C.border).lineWidth(0.3).stroke();

      curY += rowH;
      rowNum++;
    });

   // ── Footer (drawn right after table, no blank pages) ──
    const footerY = curY + 16;

    // Only add footer if it fits on current page
    if (footerY + 30 < doc.page.height) {
      doc.moveTo(LEFT, footerY)
         .lineTo(LEFT + PAGE_W, footerY)
         .strokeColor(C.border).lineWidth(0.5).stroke();

      doc.fontSize(7.5).fillColor(C.muted).font('Helvetica')
         .text(
           'RSIMS — Retail Store Inventory Management System',
           LEFT,
           footerY + 8,
           { align: 'left', width: PAGE_W / 2, lineBreak: false }
         );

      doc.fontSize(7.5).fillColor(C.muted).font('Helvetica')
         .text(
           'Confidential',
           LEFT,
           footerY + 8,
           { align: 'right', width: PAGE_W, lineBreak: false }
         );
    }

    doc.end();

  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate PDF.' });
    }
  }
});

module.exports = router;