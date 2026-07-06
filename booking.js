document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById("formDatPhong");
    const checkInInput = document.getElementById("checkIn");
    const checkOutInput = document.getElementById("checkOut");
    const customerNameInput = document.getElementById("customerName");
    const customerPhoneInput = document.getElementById("customerPhone");

    if (bookingForm && checkInInput && checkOutInput && customerNameInput) {
        customerNameInput.addEventListener("input", validateCustomerName);
        if (customerPhoneInput) customerPhoneInput.addEventListener("input", validateCustomerPhone);
        checkInInput.addEventListener("input", validateDates);
        checkOutInput.addEventListener("input", validateDates);
        bookingForm.addEventListener("submit", handleBookingSubmit);
    }
    setupMinDates();
});

function showBookingForm() {
    const modalElement = document.getElementById('roomModal');
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    }
    $("#bookingForm").slideDown(500, function() {
        $('html, body').animate({
            scrollTop: $("#bookingForm").offset().top - 80
        }, 300);
    });
}

function setupMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const checkInInput = document.getElementById("checkIn");
    if (checkInInput) checkInInput.setAttribute("min", today);
}

function calculateNights(checkInStr, checkOutStr) {
    const start = new Date(checkInStr);
    const end = new Date(checkOutStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        return 0;
    }
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function validateCustomerName() {
    const input = document.getElementById("customerName");
    const errorEl = document.getElementById("customerNameError");
    if (!input || !errorEl) return false;
    if (input.value.trim() === "") {
        errorEl.innerText = "❌ Họ và tên khách hàng không được để trống!";
        input.classList.add("is-invalid");
        return false;
    } else {
        errorEl.innerText = "";
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
        return true;
    }
}

function validateCustomerPhone() {
    const input = document.getElementById("customerPhone");
    const errorEl = document.getElementById("customerPhoneError");
    if (!input || !errorEl) return false;
    
    const phoneVal = input.value.trim();
    const phoneRegex = /^[0-9]{10}$/; 

    if (phoneVal === "") {
        errorEl.innerText = "❌ Số điện thoại không được để trống!";
        input.classList.add("is-invalid");
        return false;
    } else if (!phoneRegex.test(phoneVal)) {
        errorEl.innerText = "❌ Số điện thoại phải nhập đúng 10 chữ số!";
        input.classList.add("is-invalid");
        return false;
    } else {
        errorEl.innerText = "";
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
        return true;
    }
}

function validateDates() {
    const cin = document.getElementById("checkIn");
    const cout = document.getElementById("checkOut");
    const errorEl = document.getElementById("dateError");
    const infoEl = document.getElementById("bookingInfo");
    if (!cin || !cout || !errorEl || !infoEl) return false;
    if (!cin.value || !cout.value) {
        errorEl.innerText = "❌ Vui lòng chọn đầy đủ cả ngày nhận và ngày trả phòng!";
        cin.classList.add("is-invalid");
        cout.classList.add("is-invalid");
        infoEl.style.display = "none";
        return false;
    }
    const nights = calculateNights(cin.value, cout.value);
    if (nights <= 0) {
        errorEl.innerText = "❌ Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 ngày!";
        cin.classList.add("is-invalid");
        cout.classList.add("is-invalid");
        infoEl.style.display = "none";
        return false;
    } else {
        errorEl.innerText = "";
        cin.classList.remove("is-invalid");
        cout.classList.remove("is-invalid");
        cin.classList.add("is-valid");
        cout.classList.add("is-valid");
        if (currentRoom) {
            const totalCost = nights * Number(currentRoom.price);
            $("#bookingInfo").html(`
                <div class="alert alert-info py-2">
                    <p class="mb-1">🔢 Tổng số đêm: <b>${nights} đêm</b></p>
                    <p class="mb-0 text-danger fw-bold">💰 Tổng tiền tạm tính: ${totalCost.toLocaleString()} VNĐ</p>
                </div>
            `).show();
        }
        return true;
    }
}

function handleBookingSubmit(e) {
    e.preventDefault();
    const isNameValid = validateCustomerName();
    const isPhoneValid = validateCustomerPhone();
    const isDateValid = validateDates();
    
    if (!isNameValid || !isPhoneValid || !isDateValid) {
        return;
    }
    if (!currentRoom) {
        alert("Vui lòng chọn phòng trước khi thực hiện đặt!");
        return;
    }
    const cinVal = document.getElementById("checkIn").value;
    const coutVal = document.getElementById("checkOut").value;
    const nights = calculateNights(cinVal, coutVal);
    const totalMoney = nights * Number(currentRoom.price);
    
    const bookingData = {
        customer: document.getElementById("customerName").value.trim(),
        phone: document.getElementById("customerPhone").value.trim(), 
        gender: document.getElementById("customerGender").value,       
        room: currentRoom.name,
        category: currentRoom.category,
        nights: nights,
        total: totalMoney,
        status: "Chờ duyệt"
    };
    
    const $submitBtn = $("#formDatPhong button[type='submit']");
    $submitBtn.prop("disabled", true).text("Đang xử lý đặt phòng...");
    
    $.ajax({
        url: MOCK_API_BOOKINGS_URL,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(bookingData),
        success: function(response) {
            if (typeof allBookingsData !== 'undefined') {
                allBookingsData.push(response);
            }
            
            const totalRooms = currentRoom.totalRooms ? Number(currentRoom.totalRooms) : 10;
            const currentBookedCount = allBookingsData.filter(b => b.room === currentRoom.name && b.status !== "Từ chối").length;
            const finalAvailable = totalRooms - currentBookedCount;

            alert(`🎉 Chúc mừng! Đơn đặt phòng đã lưu thành công.\nHiện tại loại phòng [${currentRoom.name}] này còn trống: ${finalAvailable > 0 ? finalAvailable : 0} phòng.`);
            
            document.getElementById("formDatPhong").reset();
            document.getElementById("customerName").classList.remove("is-valid");
            document.getElementById("customerPhone").classList.remove("is-valid");
            document.getElementById("checkIn").classList.remove("is-valid");
            document.getElementById("checkOut").classList.remove("is-valid");
            $("#bookingInfo").hide();
            $("#bookingForm").hide(400);
            
            if (typeof displayRooms === 'function' && typeof allRoomsData !== 'undefined') {
                displayRooms(allRoomsData);
            }
        },
        error: function(xhr, status, error) {
            console.error(error);
            alert("Đã xảy ra lỗi cục bộ khi truyền dữ liệu POST lên MockAPI!");
        },
        complete: function() {
            $submitBtn.prop("disabled", false).text("Xác nhận đặt phòng");
        }
    });
}