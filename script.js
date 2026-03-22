const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    obs.unobserve(entry.target);
  });
}, { threshold: 0.16 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const SUPABASE_URL = window.SUPABASE_URL || 'PASTE_YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';

const form = document.querySelector('.consultation-form');
const serviceSelect = form?.querySelector('select[name="service"]');
const submitButton = form?.querySelector('button[type="submit"]');
const formStatus = document.querySelector('#form-status');

const isSupabaseConfigured =
  typeof window.supabase !== 'undefined' &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('PASTE_YOUR_SUPABASE_URL_HERE') &&
  !SUPABASE_ANON_KEY.includes('PASTE_YOUR_SUPABASE_ANON_KEY_HERE');

const supabaseClient = isSupabaseConfigured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function setFormStatus(message, type = 'info') {
  if (!formStatus) return;

  formStatus.textContent = message;
  formStatus.dataset.state = type;
}

async function loadServices() {
  if (!serviceSelect) return;

  serviceSelect.innerHTML = '<option value="" selected disabled>Загрузка услуг...</option>';

  if (!supabaseClient) {
    serviceSelect.innerHTML = '<option value="" selected disabled>Укажите Supabase URL и anon key</option>';
    setFormStatus('Для подключения формы добавьте SUPABASE_URL и SUPABASE_ANON_KEY в index.html.', 'error');
    return;
  }

  const { data, error } = await supabaseClient
    .from('services')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Ошибка загрузки услуг:', error);
    serviceSelect.innerHTML = '<option value="" selected disabled>Не удалось загрузить услуги</option>';
    setFormStatus('Не удалось получить список услуг из Supabase.', 'error');
    return;
  }

  serviceSelect.innerHTML = '<option value="" selected disabled>Выберите юридическую услугу</option>';

  data.forEach((service) => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    serviceSelect.append(option);
  });
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    setFormStatus('Форма не подключена: заполните настройки Supabase.', 'error');
    return;
  }

  const formData = new FormData(form);
  const payload = {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    service_id: String(formData.get('service') || '').trim(),
    status: 'new',
  };

  if (!payload.name || !payload.email || !payload.service_id) {
    setFormStatus('Заполните все обязательные поля.', 'error');
    return;
  }

  const initialText = submitButton?.textContent || 'Записаться на консультацию';

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Отправляем...';
  }

  setFormStatus('');

  const { error } = await supabaseClient.from('contact_requests').insert(payload);

  if (error) {
    console.error('Ошибка отправки заявки:', error);
    setFormStatus('Не удалось отправить заявку. Проверьте настройки Supabase и RLS policy.', 'error');

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = initialText;
    }
    return;
  }

  form.reset();
  setFormStatus('Заявка успешно отправлена. Мы свяжемся с вами в ближайшее время.', 'success');

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = initialText;
  }
});

loadServices();
