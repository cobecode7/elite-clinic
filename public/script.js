// 1. قائمة الجوال
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => mainNav.classList.toggle('active'));
}

// 2. تفاعلات الـ Hero
const dayChips = document.querySelectorAll('.day-chip');
const slots = document.querySelectorAll('.slot');
const heroConfirmBtn = document.getElementById('heroConfirmBtn');

dayChips.forEach(chip => {
  chip.addEventListener('click', () => {
    dayChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});
slots.forEach(slot => {
  slot.addEventListener('click', () => {
    slots.forEach(s => s.classList.remove('picked'));
    slot.classList.add('picked');
  });
});
if (heroConfirmBtn) {
  heroConfirmBtn.addEventListener('click', () => {
    openModal(); // فتح النافذة بدل التنقل
  });
}

// 3. النافذة المنبثقة (Modal) ورسالة النجاح (Toast)
const modal = document.getElementById('bookingModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const toast = document.getElementById('successToast');

function openModal() { if(modal) modal.classList.add('active'); }
function closeModal() { if(modal) modal.classList.remove('active'); }
function showToast() { 
  if(toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500); // تختفي بعد 3.5 ثانية
  }
}

if(openModalBtn) openModalBtn.addEventListener('click', openModal);
if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
// إغلاق النافذة عند الضغط خارجها
if(modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

// 4. جلب الأطباء وعرضهم في الموقع ديناميكياً
async function loadDoctors() {
  try {
    const res = await fetch('/api/doctors');
    const doctors = await res.json();

    // أ) تعبئة قسم الأطباء في الصفحة الرئيسية
    const grid = document.getElementById('doctorsGrid');
    if (grid) {
      grid.innerHTML = '';
      
      doctors.forEach(doc => {
        let cleanName = doc.name.replace(/د\.?\s?/, '').trim();
        let nameParts = cleanName.split(/\s+/).filter(Boolean);
        let initials = nameParts.length >= 2 
          ? `${nameParts[0][0]}.${nameParts[1][0]}` 
          : (nameParts[0] ? nameParts[0][0] : '');

        // تمت إزالة onclick واستبدالها بـ data-doctor-id
        grid.innerHTML += `
          <div class="doc-card">
            <div class="avatar" style="background:${doc.avatarColor};">${initials}</div>
            <h4>${doc.name}</h4>
            <div class="spec">${doc.specialty}</div>
            <div class="stars">★★★★★</div>
            <button class="btn btn-sm btn-mint open-modal-btn" data-doctor-id="${doc.id}">احجز معه</button>
          </div>
        `;
      });
    }

    // ب) تعبئة القائمة المنسدلة في نافذة الحجز (Modal)
    const select = document.getElementById('patientDoctor');
    if (select) {
      select.innerHTML = '<option value="">اختر الطبيب أولاً</option>';
      doctors.forEach(doc => {
        let option = document.createElement('option');
        option.value = doc.id;
        option.text = `${doc.name} - ${doc.specialty}`;
        select.appendChild(option);
      });
    }

    // 🚀 تفويض الأحداث (Event Delegation) لالتقاط نقرات أزرار الأطباء بدون onclick
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.open-modal-btn');
      if (btn) {
        e.preventDefault(); // منع الرابط من التحرك لأسفل الصفحة
        openModal(); // فتح النافذة
        
        // إذا كان الزر يحمل معرف طبيب، قم بتحديده في القائمة المنسدلة
        const docId = btn.getAttribute('data-doctor-id');
        if (docId && select) {
          select.value = docId;
        }
      }
    });

  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}
loadDoctors();

// 5. إرسال النموذج
const bookingForm = document.getElementById('bookingForm');

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerText = 'جاري الإرسال...';

       const data = {
      name: document.getElementById('patientName').value,
      phone: document.getElementById('patientPhone').value,
      department: document.getElementById('patientDept').value,
      doctorId: document.getElementById('patientDoctor').value,
      bookingDay: document.getElementById('bookingDay').value, // جديد
      bookingTime: document.getElementById('bookingTime').value // جديد
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        bookingForm.reset();
        closeModal();
        showToast();
      } else {
        // عرض رسالة الخطأ القادمة من الـ Zod (مثلاً: رقم الجوال غير صحيح)
        alert(result.details || result.error || 'حدث خطأ غير متوقع');
      }
    } catch (error) {
      alert('✗ تعذر الاتصال بالخادم.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'تأكيد طلب الحجز ←';
    }
  });
}
