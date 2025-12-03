// API Base URL (sẽ tự động thay đổi khi deploy)
const API_BASE = window.location.origin;

// Biến toàn cục
let expenses = [];
let budget = {
    total: 700000000,
    construction: 300000000,
    interior: 200000000,
    garden: 100000000,
    other: 100000000
};

// Hàm định dạng tiền Việt Nam
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(amount);
}

// Hàm định dạng số đơn giản (1.5tr, 500k)
function formatSimpleCurrency(amount) {
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'tr';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(0) + 'k';
    }
    return amount;
}

// Hàm hiển thị thông báo
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Hàm mở modal thêm chi phí
function openAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    document.getElementById('expense-form').reset();
    modal.style.display = 'flex';
}

// Hàm đóng modal
function closeModal() {
    document.getElementById('addExpenseModal').style.display = 'none';
}

// Hàm lấy dữ liệu từ API
async function fetchExpenses() {
    try {
        const response = await fetch(`${API_BASE}/api/expenses`);
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        expenses = await response.json();
        updateUI();
    } catch (error) {
        console.error('Lỗi khi tải chi phí:', error);
        showNotification('Không thể tải dữ liệu chi phí', 'error');
    }
}

// Hàm thêm chi phí mới
async function addExpense(expenseData) {
    try {
        const response = await fetch(`${API_BASE}/api/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(expenseData)
        });
        
        if (!response.ok) throw new Error('Không thể thêm chi phí');
        
        showNotification('Đã thêm chi phí thành công!', 'success');
        await fetchExpenses();
        closeModal();
    } catch (error) {
        console.error('Lỗi khi thêm chi phí:', error);
        showNotification('Không thể thêm chi phí', 'error');
    }
}

// Hàm xóa chi phí
async function deleteExpense(id) {
    if (!confirm('Bạn có chắc muốn xóa chi phí này?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/expenses/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Không thể xóa chi phí');
        
        showNotification('Đã xóa chi phí thành công!', 'success');
        await fetchExpenses();
    } catch (error) {
        console.error('Lỗi khi xóa chi phí:', error);
        showNotification('Không thể xóa chi phí', 'error');
    }
}

// Hàm cập nhật giao diện
function updateUI() {
    updateSummary();
    updateCategoryProgress();
    updateExpenseTable();
    updateBudgetDisplay();
}

// Hàm cập nhật tổng quan
function updateSummary() {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget.total - totalSpent;
    const transactionCount = expenses.length;
    const averageAmount = transactionCount > 0 ? totalSpent / transactionCount : 0;
    
    // Cập nhật header
    document.querySelector('.spent-amount').textContent = formatCurrency(totalSpent);
    document.querySelector('.remaining-amount').textContent = formatCurrency(remaining);
    
    // Cập nhật summary
    document.querySelector('.summary-total').textContent = formatCurrency(totalSpent);
    document.querySelector('.summary-count').textContent = transactionCount;
    document.querySelector('.summary-average').textContent = formatCurrency(averageAmount);
}

// Hàm cập nhật tiến độ hạng mục
function updateCategoryProgress() {
    const categories = ['construction', 'interior', 'garden', 'other'];
    
    categories.forEach(category => {
        const categoryExpenses = expenses.filter(e => e.category === category);
        const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        const budgetAmount = budget[category];
        const percentage = (totalSpent / budgetAmount) * 100;
        
        // Tìm element và cập nhật
        const categoryItem = document.querySelector(`[data-category="${category}"]`);
        if (categoryItem) {
            const progressFill = categoryItem.querySelector('.progress-fill');
            const categoryAmount = categoryItem.querySelector('.category-amount');
            
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
            categoryAmount.textContent = `${formatSimpleCurrency(totalSpent)}/${formatSimpleCurrency(budgetAmount)}`;
            
            // Đổi màu progress bar nếu vượt quá 90%
            if (percentage > 90) {
                progressFill.style.background = 'linear-gradient(to right, #f8961e, #f72585)';
            } else {
                progressFill.style.background = 'linear-gradient(to right, #4cc9f0, #4361ee)';
            }
        }
    });
}

// Hàm cập nhật bảng chi phí
function updateExpenseTable() {
    const tbody = document.getElementById('expenses-table-body');
    const categoryFilter = document.getElementById('category-filter').value;
    const monthFilter = document.getElementById('month-filter').value;
    
    // Lọc chi phí
    let filteredExpenses = [...expenses];
    
    if (categoryFilter !== 'all') {
        filteredExpenses = filteredExpenses.filter(e => e.category === categoryFilter);
    }
    
    if (monthFilter) {
        const [year, month] = monthFilter.split('-');
        filteredExpenses = filteredExpenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() == year && 
                   (expenseDate.getMonth() + 1) == month;
        });
    }
    
    // Sắp xếp theo ngày mới nhất
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Xóa hàng hiện tại
    tbody.innerHTML = '';
    
    if (filteredExpenses.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">Không có chi phí nào phù hợp với bộ lọc</td>
            </tr>
        `;
        return;
    }
    
    // Thêm hàng mới
    filteredExpenses.forEach(expense => {
        const row = document.createElement('tr');
        
        // Định dạng ngày
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('vi-VN');
        
        // Tên hạng mục
        const categoryNames = {
            construction: 'Phần thô',
            interior: 'Nội thất',
            garden: 'Sân vườn',
            other: 'Phát sinh'
        };
        
        // CSS class cho hạng mục
        const categoryClass = `category-${expense.category}`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>
                <span class="expense-category ${categoryClass}">
                    ${categoryNames[expense.category]}
                </span>
            </td>
            <td>
                <strong>${expense.description}</strong>
                ${expense.notes ? `<br><small>${expense.notes}</small>` : ''}
            </td>
            <td class="expense-amount">${formatCurrency(expense.amount)}</td>
            <td>
                <div class="expense-actions">
                    <button class="btn-action btn-delete" onclick="deleteExpense('${expense.id}')">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Hàm cập nhật hiển thị ngân sách
function updateBudgetDisplay() {
    document.querySelector('.total-budget').textContent = formatCurrency(budget.total);
}

// Hàm xử lý form thêm chi phí
function setupFormHandler() {
    const form = document.getElementById('expense-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const expenseData = {
            category: document.getElementById('expense-category').value,
            description: document.getElementById('expense-description').value,
            amount: parseInt(document.getElementById('expense-amount').value),
            date: document.getElementById('expense-date').value,
            notes: document.getElementById('expense-notes').value
        };
        
        await addExpense(expenseData);
    });
}

// Hàm thiết lập filter
function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const monthFilter = document.getElementById('month-filter');
    
    // Đặt tháng hiện tại làm giá trị mặc định
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    monthFilter.value = currentMonth;
    
    // Thêm sự kiện change cho filter
    categoryFilter.addEventListener('change', updateExpenseTable);
    monthFilter.addEventListener('change', updateExpenseTable);
}

// Hàm khởi động ứng dụng
async function initApp() {
    console.log('Đang khởi động ứng dụng...');
    
    // Kiểm tra API
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        if (!response.ok) {
            console.warn('API không khả dụng, sử dụng dữ liệu mẫu');
            loadSampleData();
        } else {
            await fetchExpenses();
        }
    } catch (error) {
        console.warn('Không thể kết nối API, sử dụng dữ liệu mẫu');
        loadSampleData();
    }
    
    // Thiết lập handlers
    setupFormHandler();
    setupFilters();
    
    // Đóng modal khi click bên ngoài
    window.onclick = function(event) {
        const modal = document.getElementById('addExpenseModal');
        if (event.target === modal) {
            closeModal();
        }
    };
}

// Hàm tải dữ liệu mẫu (dùng khi API không khả dụng)
function loadSampleData() {
    expenses = [
        {
            id: '1',
            category: 'construction',
            description: 'Tiền công thợ xây',
            amount: 25000000,
            date: '2024-01-15',
            notes: 'Thợ chính + 2 phụ'
        },
        {
            id: '2',
            category: 'construction',
            description: 'Xi măng, cát, đá',
            amount: 35000000,
            date: '2024-01-20',
            notes: 'Mua từ công ty VLXD An Phú'
        },
        {
            id: '3',
            category: 'interior',
            description: 'Bàn ghế phòng khách',
            amount: 15000000,
            date: '2024-02-05',
            notes: ''
        },
        {
            id: '4',
            category: 'garden',
            description: 'Cây xanh và thảm cỏ',
            amount: 8000000,
            date: '2024-02-10',
            notes: '10 cây hoa giấy, 20m² cỏ'
        }
    ];
    
    updateUI();
    showNotification('Đang sử dụng dữ liệu mẫu', 'info');
}

// Khởi động ứng dụng khi trang đã tải xong
document.addEventListener('DOMContentLoaded', initApp);