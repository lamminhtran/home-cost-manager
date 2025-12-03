const { createClient } = require('@vercel/postgres');

module.exports = async (req, res) => {
  // Thiết lập CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const client = createClient();
  
  try {
    await client.connect();
    
    if (req.method === 'GET') {
      // Lấy thông tin ngân sách
      const result = await client.query('SELECT * FROM budget LIMIT 1');
      
      if (result.rows.length === 0) {
        // Nếu chưa có dữ liệu, tạo mẫu
        const defaultBudget = {
          total: 700000000,
          construction: 300000000,
          interior: 200000000,
          garden: 100000000,
          other: 100000000
        };
        
        await client.query(
          `INSERT INTO budget (total, construction, interior, garden, other) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            defaultBudget.total,
            defaultBudget.construction,
            defaultBudget.interior,
            defaultBudget.garden,
            defaultBudget.other
          ]
        );
        
        res.status(200).json(defaultBudget);
      } else {
        res.status(200).json(result.rows[0]);
      }
    } else if (req.method === 'PUT') {
      // Cập nhật ngân sách
      const { total, construction, interior, garden, other } = req.body;
      
      await client.query(
        `UPDATE budget SET 
          total = $1, 
          construction = $2, 
          interior = $3, 
          garden = $4, 
          other = $5 
         WHERE id = 1`,
        [total, construction, interior, garden, other]
      );
      
      res.status(200).json({ message: 'Cập nhật ngân sách thành công' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.end();
  }
};