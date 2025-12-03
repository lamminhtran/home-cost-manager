const { createClient } = require('@vercel/postgres');

module.exports = async (req, res) => {
  // Thiết lập CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Xử lý preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  const client = createClient();
  
  try {
    await client.connect();
    
    switch (req.method) {
      case 'GET':
        // Lấy tất cả chi phí
        const result = await client.query(`
          SELECT * FROM expenses 
          ORDER BY date DESC
        `);
        console.log(`Found ${result.rows.length} expenses`);
        res.status(200).json(result.rows);
        break;
        
      case 'POST':
        // Thêm chi phí mới
        const { category, description, amount, date, notes } = req.body;
        console.log('POST body:', req.body);
        
        // Tạo ID đơn giản không cần uuid
        const id = 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        
        await client.query(
          `INSERT INTO expenses (id, category, description, amount, date, notes, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [id, category, description, amount, date, notes || '']
        );
        
        console.log(`Added expense with id: ${id}`);
        
        res.status(201).json({ 
          success: true,
          id, 
          category, 
          description, 
          amount, 
          date, 
          notes: notes || '',
          message: 'Thêm chi phí thành công' 
        });
        break;
        
      case 'DELETE':
        // Xóa chi phí - Lấy id từ query string
        const deleteId = req.query.id;
        console.log(`DELETE request for id: ${deleteId}`);
        
        if (!deleteId) {
          console.error('No ID provided for DELETE');
          return res.status(400).json({ 
            success: false,
            error: 'Thiếu ID chi phí' 
          });
        }
        
        const deleteResult = await client.query(
          'DELETE FROM expenses WHERE id = $1 RETURNING *',
          [deleteId]
        );
        
        if (deleteResult.rowCount === 0) {
          console.error(`No expense found with id: ${deleteId}`);
          return res.status(404).json({ 
            success: false,
            error: 'Không tìm thấy chi phí' 
          });
        }
        
        console.log(`Deleted expense with id: ${deleteId}`);
        
        res.status(200).json({ 
          success: true,
          message: 'Xóa chi phí thành công',
          deletedExpense: deleteResult.rows[0]
        });
        break;
        
      default:
        res.status(405).json({ 
          success: false,
          error: 'Method not allowed' 
        });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    await client.end();
  }
};