const MOCK_API_ROOMS_URL = "https://6a0ea8f81736097c360a3c17.mockapi.io/room"; 
// Thêm link API đơn hàng vào đây để tính toán số phòng đã đặt
const MOCK_API_BOOKINGS_URL = "https://6a0eaa351736097c360a410c.mockapi.io/Student"; 

let allRoomsData = [];
let allBookingsData = []; // Biến lưu trữ đơn hàng để tính phòng trống
let currentRoom = null;
const loadingText = "Đang tải dữ liệu...";
const itemsPerPage = 6;

document.addEventListener('DOMContentLoaded', () => {
    fetchRoomsAndBookings(); // Thay vì chỉ fetch phòng, ta fetch cả 2
    setupRoomEvents();
});

function setupRoomEvents() {
    const filterSelect = document.getElementById("typeFilter");
    if (filterSelect) {
        filterSelect.addEventListener("change", filterRooms);
    }
}

// Hàm mới: Tải song song cả dữ liệu phòng và dữ liệu đơn hàng để tính phòng trống
function fetchRoomsAndBookings() {
    const container = document.getElementById("roomContainer");
    if (!container) return;
    container.innerHTML = `
        <div class="text-center w-100 py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">${loadingText}</p>
        </div>
    `;

    // Gọi song song 2 API bằng Promise.all
    Promise.all([
        fetch(MOCK_API_ROOMS_URL).then(res => res.json()),
        fetch(MOCK_API_BOOKINGS_URL).then(res => res.json())
    ])
    .then(([roomsData, bookingsData]) => {
        allRoomsData = roomsData;
        allBookingsData = bookingsData;
        displayRooms(allRoomsData);
    })
    .catch(error => {
        console.error(error);
        container.innerHTML = `
            <div class="alert alert-danger w-100 text-center shadow-sm" role="alert">
                ⚠️ Lỗi hệ thống: ${error.message}
            </div>
        `;
    });
}

function formatRoomPrice(price) {
    let numericPrice = Number(price);
    return numericPrice.toLocaleString() + " VNĐ / đêm";
}

// Hàm bổ trợ: Tính số lượng phòng còn trống dựa trên tên phòng hoặc danh mục
function calculateAvailableRooms(roomObj) {
    // Giả định nếu trên MockAPI của bạn chưa có trường totalRooms, hệ thống sẽ mặc định loại đó có tổng 10 phòng
    const totalRooms = roomObj.totalRooms ? Number(roomObj.totalRooms) : 10;
    
    // Đếm số đơn hàng của phòng này mà không phải là bị "Từ chối"
    const bookedCount = allBookingsData.filter(b => b.room === roomObj.name && b.status !== "Từ chối").length;
    
    const available = totalRooms - bookedCount;
    return available > 0 ? available : 0;
}

function displayRooms(dataArray) {
    const container = document.getElementById("roomContainer");
    if (!container) return;
    container.innerHTML = "";

    if (dataArray.length === 0) {
        container.innerHTML = "<p class='text-center w-100 text-muted my-4'>Không tìm thấy phòng phù hợp.</p>";
        return;
    }
    for (let i = 0; i < dataArray.length; i++) {
        const room = dataArray[i];
        const formattedPrice = formatRoomPrice(room.price);
        // Tính số phòng trống hiện tại
        const availableRooms = calculateAvailableRooms(room);
        
        container.innerHTML += `
            <div class="col-10 col-md-6 col-lg-4 mb-4">
                <div class="card room-card h-100 shadow-sm border-0" data-id="${room.id}">
                    <img src="${room.image || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'}" class="card-img-top" alt="${room.name}" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column justify-content-between p-4">
                        <div>
                            <h5 class="card-title text-truncate fw-bold text-dark">${room.name}</h5>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge bg-primary">${room.category}</span>
                                <span class="small fw-bold text-secondary">Còn trống: ${availableRooms} phòng</span>
                            </div>
                            <p class="card-text text-danger fw-bold fs-5 mb-3">${formattedPrice}</p>
                        </div>
                        <button class="btn btn-outline-primary btn-detail w-100 py-2 fw-semibold" data-id="${room.id}" ${availableRooms === 0 ? 'disabled' : ''}>
                            ${availableRooms === 0 ? 'Hết phòng' : 'Xem chi tiết'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    const detailButtons = container.querySelectorAll(".btn-detail");
    detailButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const roomId = this.getAttribute("data-id");
            showDetail(roomId);
        });
    });
    addRoomHoverEffects();
}

function filterRooms() {
    const filterSelect = document.getElementById("typeFilter");
    const selectedCategory = filterSelect ? filterSelect.value : "";
    if (selectedCategory === "") {
        displayRooms(allRoomsData);
    } else {
        const filtered = [];
        for (let i = 0; i < allRoomsData.length; i++) {
            if (allRoomsData[i].category === selectedCategory) {
                filtered.push(allRoomsData[i]);
            }
        }
        displayRooms(filtered);
    }
}

function showDetail(id) {
    for (let i = 0; i < allRoomsData.length; i++) {
        if (allRoomsData[i].id == id) {
            currentRoom = allRoomsData[i];
            break;
        }
    }
    if (!currentRoom) return;
    
    const availableRooms = calculateAvailableRooms(currentRoom);

    document.getElementById("roomName").innerText = currentRoom.name;
    document.getElementById("roomType").innerHTML = `<b>Danh mục:</b> ${currentRoom.category} | <span class="text-success"><b>Còn trống:</b> ${availableRooms} phòng</span>`;
    document.getElementById("roomPrice").innerHTML = `<b>Giá niêm yết:</b> ${formatRoomPrice(currentRoom.price)}`;
    const imgContainer = document.getElementById("roomImageContainer");
    if (imgContainer) {
        imgContainer.innerHTML = `<img src="${currentRoom.image}" class="img-fluid rounded shadow-sm w-100" style="max-height: 250px; object-fit: cover;">`;
    }
    const modalEl = document.getElementById('roomModal');
    if (modalEl) {
        const myModal = new bootstrap.Modal(modalEl);
        myModal.show();
    }
}

function addRoomHoverEffects() {
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('mouseover', function() {
            this.classList.add('shadow-lg');
        });
        card.addEventListener('mouseout', function() {
            this.classList.remove('shadow-lg');
        });
    });
}