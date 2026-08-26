const API = '/api/admin';

// --- 1. تسجيل الدخول ---
document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');
  
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'same-origin'
    });
    const data = await res.json();
    
    if (res.ok) {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
      loadDashboard();
    } else {
      errorEl.innerText = data.error || 'بيانات الدخول غير صحيحة';
    }
  } catch (err) {
    errorEl.innerText = 'فشل الاتصال بالخادم';
  }
});

// --- 2. التنقل بين الأقسام (بدون onclick) ---
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault(); // منع تحديث الصفحة
    const sectionId = link.getAttribute('data-section');
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
  });
});

// --- 3. الفلترة (بدون onchange) ---
document.getElementById('bookingFilter').addEventListener('change', loadBookings);

// --- 4. إضافة طبيب (بدون onclick) ---
document.getElementById('addDoctorBtn').addEventListener('click', addDoctor);

// --- 5. تفويض الأحداث لأزرار الحجوزات (تأكيد/حذف) ---
// هذه الطريقة الاحترافية تلتقط النقر على الأزرار حتى لو تم إنشاؤها ديناميكياً
document.getElementById('bookingsList').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return; // إذا لم يكن الزر هو المضغوط، تجاهل

  const id = btn.getAttribute('data-id');
  
  if (btn.classList.contains('confirm-btn')) {
    await fetch(`${API}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
      credentials: 'same-origin'
    });
    loadDashboard(); 
  } 
  else if (btn.classList.contains('delete-btn')) {
    if (!confirm('هل أنت متأكد من حذف هذا الحجز نهائياً؟')) return;
    
    const res = await fetch(`${API}/bookings/${id}`, { 
      method: 'DELETE',
      credentials: 'same-origin'
    });
    
    if (res.ok) loadDashboard();
    else alert('حدث خطأ أثناء الحذف');
  }
});

// --- دوال جلب البيانات ---
async function loadDashboard() {
  try {
    const statsRes = await fetch(`${API}/stats`, { credentials: 'same-origin' });
    if (statsRes.status === 403) return logout();
    
    const stats = await statsRes.json();
    document.getElementById('totalBookings').innerText = stats.totalBookings;
    document.getElementById('pendingBookings').innerText = stats.pendingBookings;
    document.getElementById('totalDoctors').innerText = stats.totalDoctors;

    await loadBookings();

    const doctorsRes = await fetch(`${API}/doctors`, { credentials: 'same-origin' });
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

async function loadBookings() {
  const filterEl = document.getElementById('bookingFilter');
  const filter = filterEl ? filterEl.value : 'all';
  
  const bookingsRes = await fetch(`${API}/bookings`, { credentials: 'same-origin' });
  const bookings = await bookingsRes.json();
  
  const bList = document.getElementById('bookingsList');
  bList.innerHTML = '';

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
          <small>القسم: ${b.department} | الطبيب: ${docName}</small><br>
          <small style="color:var(--blue); font-weight:800;">📅 موعد الحجز: ${b.bookingDay} - ${b.bookingTime}</small>
        </div>
        <div class="booking-actions">
          <span class="status-${b.status}">${b.status === 'pending' ? 'معلق' : 'مؤكد'}</span>
          ${b.status === 'pending' ? `<button class="btn btn-mint confirm-btn" data-id="${b.id}" style="padding:5px 10px; font-size:12px;">تأكيد</button>` : ''}
          <button class="btn delete-btn" data-id="${b.id}" style="padding:5px 10px; font-size:12px; background:var(--coral); color:#fff;">حذف</button>
        </div>
      </div>`;
  });
}

async function addDoctor() {
  const name = document.getElementById('docName').value;
  const specialty = document.getElementById('docSpec').value;
  if(!name || !specialty) return alert('أدخل جميع البيانات');
  
  await fetch(`${API}/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, specialty }),
    credentials: 'same-origin'
  });
  
  document.getElementById('docName').value = '';
  document.getElementById('docSpec').value = '';
  loadDashboard();
}

function logout() {
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('password').value = '';
}
