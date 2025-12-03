const { createClient } = require('@vercel/postgres');

module.exports = async (req, res) => {
  const client = createClient();
  
  try {
    await client.connect();
    
    // Tạo bảng expenses
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(255) PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tạo bảng budget
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget (
        id SERIAL PRIMARY KEY,
        total BIGINT NOT NULL,
        construction BIGINT NOT NULL,
        interior BIGINT NOT NULL,
        garden BIGINT NOT NULL,
        other BIGINT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Chèn dữ liệu mẫu cho budget nếu chưa có
    const budgetCheck = await client.query('SELECT COUNT(*) FROM budget');
    if (parseInt(budgetCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO budget (total, construction, interior, garden, other) 
        VALUES (700000000, 300000000, 200000000, 100000000, 100000000)
      `);
    }
    
    res.status(200).json({ 
      message: 'Database migration completed successfully',
      tables: ['expenses', 'budget']
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed',
      details: error.message 
    });
  } finally {
    await client.end();
  }
};