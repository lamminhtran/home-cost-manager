const { createClient } = require('@vercel/postgres');
const { v4: uuidv4 } = require('uuid');

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
        res.status(200).json(result.rows);
        break;
        
      case 'POST':
        // Thêm chi phí mới
        const { category, description, amount, date, notes } = req.body;
        const id = uuidv4();
        
        await client.query(
          `INSERT INTO expenses (id, category, description, amount, date, notes, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [id, category, description, amount, date, notes || '']
        );
        
        res.status(201).json({ 
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
        // Xóa chi phí
        const { id: deleteId } = req.query;
        
        await client.query(
          'DELETE FROM expenses WHERE id = $1',
          [deleteId]
        );
        
        res.status(200).json({ message: 'Xóa chi phí thành công' });
        break;
        
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    await client.end();
  }
};