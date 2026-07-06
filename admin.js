const MOCK_API_BOOKINGS_URL = "https://6a0eaa351736097c360a410c.mockapi.io/Student"; 
let bookings = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminBookingsPromise();
});

function fetchAdminBookingsPromise() {
    const tableBody = document.getElementById("bookingTable");
    if (!tableBody) return;
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Đang kéo danh sách đơn hàng từ Server Cloud...</p>
            </td>
        </tr>
    `;
    fetch(MOCK_API_BOOKINGS_URL)
        .then(response => {
            if (!response.ok) throw new Error("Máy chủ API từ chối phản hồi dữ liệu!");
            return response.json();
        })
        .then(data => {
            bookings = data;
            renderBookingsTable();
        })
        .catch(error => {
            console.error(error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger fw-bold py-4">
                        Thao tác tải đơn hàng thất bại: ${error.message}
                    </td>
                </tr>
            `;
        });
}

function renderBookingsTable() {
    const tableBody = document.getElementById("bookingTable");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    if (bookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">Hiện tại trống. Không có yêu cầu đặt phòng nào.</td>
            </tr>
        `;
        return;
    }
    
    for (let i = 0; i < bookings.length; i++) {
        const b = bookings[i];
        let badgeClass = "bg-warning text-dark";
        let paymentSection = ""; 
        
        if (b.status === "Đã duyệt") {
            badgeClass = "bg-success";
            // Nút Xác nhận thanh toán xuất hiện khi đơn hàng đã được Duyệt thành công
            paymentSection = `
                <button class="btn btn-sm btn-outline-success ms-2 fw-bold" onclick="confirmPaymentAndReleaseRoom('${b.id}')">
                    💰 Xác nhận thanh toán
                </button>
            `;
        }
        
        const isProcessed = b.status !== "Chờ duyệt";
        
        // Đọc thông tin Số điện thoại và Giới tính (với cơ chế dự phòng dữ liệu cũ trống)
        const phone = b.phone ? b.phone : "Chưa cập nhật";
        const gender = b.gender ? b.gender : "Chưa rõ";
        const genderBadge = gender === "Nam" ? "bg-info text-dark" : "bg-danger-subtle text-danger";
        
        tableBody.innerHTML += `
            <tr id="row-order-${b.id}">
                <!-- Cột 1: Thông tin liên hệ đầy đủ của khách -->
                <td class="ps-3">
                    <div class="fw-bold text-dark">${b.customer}</div>
                    <div class="small text-muted"><i class="bi bi-telephone"></i> SĐT: <b>${phone}</b></div>
                    <span class="badge ${genderBadge} mt-1" style="font-size: 0.75rem; padding: 2px 8px;">${gender}</span>
                </td>
                <td>${b.room} <br><small class="text-muted">(${b.category})</small></td>
                <td>${b.nights} đêm</td>
                <td class="text-primary fw-bold">${Number(b.total).toLocaleString()} VNĐ</td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="badge ${badgeClass}">${b.status}</span>
                        ${paymentSection}
                    </div>
                </td>
                <td class="text-end pe-3">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-success" onclick="updateOrderStatusPromise('${b.id}', 'Đã duyệt')" ${isProcessed ? 'disabled' : ''}>Duyệt</button>
                        <button class="btn btn-danger" onclick="rejectAndDestroyBookingPromise('${b.id}')" ${isProcessed ? 'disabled' : ''}>Từ chối</button>
                    </div>
                </td>
            </tr>
        `;
    }
}

function findBookingIndexById(targetId) {
    for (let i = 0; i < bookings.length; i++) {
        if (bookings[i].id === targetId) {
            return i;
        }
    }
    return -1;
}

// DUYỆT ĐƠN: Đổi trạng thái sang "Đã duyệt"
function updateOrderStatusPromise(id, statusText) {
    const row = document.getElementById(`row-order-${id}`);
    if (row) row.style.opacity = "0.4";
    
    fetch(`${MOCK_API_BOOKINGS_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: statusText })
    })
    .then(response => {
        if (!response.ok) throw new Error("Cập nhật trạng thái lên API mây thất bại!");
        return response.json();
    })
    .then(updatedObj => {
        let index = findBookingIndexById(id);
        if (index !== -1) {
            bookings[index] = updatedObj;
        }
        renderBookingsTable();
    })
    .catch(error => {
        alert("Lỗi: " + error.message);
        if (row) row.style.opacity = "1";
    });
}

// XÁC NHẬN THANH TOÁN: Mở bảng hỏi -> Đồng ý sẽ DELETE đơn để giải phóng/trả phòng
function confirmPaymentAndReleaseRoom(id) {
    if (!confirm("Đã xác nhận thanh toán thành công! Bạn có muốn hoàn tất thủ tục và trả lại phòng này không?")) {
        return;
    }
    
    const row = document.getElementById(`row-order-${id}`);
    if (row) row.style.opacity = "0.4";
    
    fetch(`${MOCK_API_BOOKINGS_URL}/${id}`, {
        method: "DELETE"
    })
    .then(response => {
        if (!response.ok) throw new Error("Không thể hoàn tất thủ tục thanh toán trên API.");
        return response.json();
    })
    .then(() => {
        alert("🎉 Thanh toán hoàn tất! Phòng đã được giải phóng thành công.");
        bookings = bookings.filter(item => item.id !== id);
        renderBookingsTable();
    })
    .catch(error => {
        alert("Lỗi thao tác: " + error.message);
        if (row) row.style.opacity = "1";
    });
}

// TỪ CHỐI DUYỆT: Gửi lệnh DELETE xóa thẳng đơn khỏi hệ thống để không chiếm chỗ phòng
function rejectAndDestroyBookingPromise(id) {
    if (!confirm(`Bạn có chắc chắn muốn TỪ CHỐI và XÓA vĩnh viễn yêu cầu đặt phòng này không?`)) {
        return;
    }
    const row = document.getElementById(`row-order-${id}`);
    if (row) row.style.opacity = "0.4";
    
    fetch(`${MOCK_API_BOOKINGS_URL}/${id}`, {
        method: "DELETE"
    })
    .then(response => {
        if (!response.ok) throw new Error("Từ chối và xóa bản ghi dữ liệu thất bại.");
        return response.json();
    })
    .then(() => {
        alert("Đã từ chối và xóa yêu cầu thành công khỏi hệ thống quản trị.");
        bookings = bookings.filter(item => item.id !== id);
        renderBookingsTable();
    })
    .catch(error => {
        alert("Lỗi thao tác: " + error.message);
        if (row) row.style.opacity = "1";
    });
}