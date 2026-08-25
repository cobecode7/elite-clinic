const API = '/api/admin';

// --- تسجيل الدخول ---
document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');
  
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
      loadDashboard();
    } else {
      errorEl.innerText = data.error;
    }
  } catch (err) {
    errorEl.innerText = 'فشل الاتصال بالخادم';
  }
});

// --- التبديل بين الأقسام ---
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// --- جلب البيانات ---
async function loadDashboard() {
  try {
    // الإحصائيات
    const statsRes = await fetch(`${API}/stats`);
    if (statsRes.status === 403) return logout();
    const stats = await statsRes.json();
    document.getElementById('totalBookings').innerText = stats.totalBookings;
    document.getElementById('pendingBookings').innerText = stats.pendingBookings;
    document.getElementById('totalDoctors').innerText = stats.totalDoctors;

    // استدعاء دالة تحميل الحجوزات
    await loadBookings();

    // الأطباء
    const doctorsRes = await fetch(`${API}/doctors`);
    const doctors = await doctorsRes.json();
    const dList = document.getElementById('doctorsList');
    dList.innerHTML = '';
    doctors.forEach(d => {
      dList.innerHTML += `
        <div class="doctor-item">
          <strong>${d.name}</strong> 
          <span>${d.specialty}</span>
        </div>`;
    });

  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// --- دالة جلب الحجوزات مع الفلترة ---
async function loadBookings() {
  const filter = document.getElementById('bookingFilter').value;
  const bookingsRes = await fetch(`${API}/bookings`);
  const bookings = await bookingsRes.json();
  
  const bList = document.getElementById('bookingsList');
  bList.innerHTML = '';

  // تطبيق الفلترة محلياً
  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (filteredBookings.length === 0) {
    bList.innerHTML = '<p style="text-align:center; font-weight:700; padding:20px;">لا توجد حجوزات في هذه الفئة.</p>';
    return;
  }

  filteredBookings.forEach(b => {
    const docName = b.Doctor ? b.Doctor.name : 'لم يحدد';
    
    bList.innerHTML += `
      <div class="booking-item">
        <div>
          <strong>${b.name}</strong> - ${b.phone}<br>
          <small>القسم: ${b.department} | الطبيب: ${docName} | التاريخ: ${new Date(b.createdAt).toLocaleDateString('ar-EG')}</small>
        </div>
        <div class="booking-actions">
          <span class="status-${b.status}">${b.status === 'pending' ? 'معلق' : 'مؤكد'}</span>
          ${b.status === 'pending' ? `<button class="btn btn-mint" style="padding:5px 10px; font-size:12px;" onclick="confirmBooking(${b.id})">تأكيد</button>` : ''}
          <button class="btn" style="padding:5px 10px; font-size:12px; background:var(--coral); color:#fff;" onclick="deleteBooking(${b.id})">حذف</button>
        </div>
      </div>`;
  });
}

// --- تأكيد الحجز ---
async function confirmBooking(id) {
  await fetch(`${API}/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'confirmed' })
  });
  loadDashboard(); 
}

// --- حذف الحجز ---
async function deleteBooking(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الحجز نهائياً؟')) return;
  
  const res = await fetch(`${API}/bookings/${id}`, { method: 'DELETE' });
  if (res.ok) {
    loadDashboard(); // تحديث القائمة
  } else {
    alert('حدث خطأ أثناء الحذف');
  }
}

// --- تأكيد الحجز ---
async function confirmBooking(id) {
  await fetch(`${API}/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'confirmed' })
  });
  loadDashboard(); // تحديث القائمة
}

// --- إضافة طبيب ---
async function addDoctor() {
  const name = document.getElementById('docName').value;
  const specialty = document.getElementById('docSpec').value;
  if(!name || !specialty) return alert('أدخل جميع البيانات');
  
  await fetch(`${API}/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, specialty })
  });
  
  document.getElementById('docName').value = '';
  document.getElementById('docSpec').value = '';
  loadDashboard();
}

function logout() {
  // لتبسيط الأمور، نقوم بتحديث الصفحة لإزالة الجلسة من الذاكرة المؤقتة
  window.location.reload();
}
