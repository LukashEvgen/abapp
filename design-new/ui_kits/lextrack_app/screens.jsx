// LexTrack Screens — composed from components.jsx primitives

const { useState: useState_s } = React;

// ─── LoginScreen ────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [step, setStep] = useState_s('phone');
  const [phone, setPhone] = useState_s('+380 67 904 09 72');
  const [code, setCode] = useState_s('');
  const [error, setError] = useState_s(null);

  const sendCode = () => {
    if (!phone || phone.replace(/\s+/g, '').length < 10) {
      setError({ field: 'phone', msg: 'Невірний формат номера телефону' });
      return;
    }
    setError(null);
    setStep('code');
  };
  const verify = () => {
    if (!code || code.length < 4) {
      setError({ field: 'code', msg: 'Код має містити від 4 до 8 цифр' });
      return;
    }
    onLogin();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '54px 24px 24px', background: T.bg }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}><LexLogo size={32} /></div>
      <div style={{ ...lexFont, color: T.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
        {step === 'phone' ? 'Введіть номер телефону для входу' : 'Введіть код з SMS'}
      </div>
      {step === 'phone' ? (
        <div style={{ marginBottom: 16 }}>
          <LexInput placeholder="+380..." value={phone} onChange={setPhone}
            error={error?.field === 'phone' ? error.msg : null} />
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <LexInput placeholder="Код" value={code} onChange={setCode} autoFocus
            error={error?.field === 'code' ? error.msg : null} />
        </div>
      )}
      <LexButton onClick={step === 'phone' ? sendCode : verify}>
        {step === 'phone' ? 'Надіслати код' : 'Підтвердити'}
      </LexButton>
      {step === 'code' && (
        <button onClick={() => { setStep('phone'); setError(null); }}
          style={{ ...lexFont, marginTop: 12, background: 'transparent', border: 'none',
            color: T.textSecondary, fontSize: 12, cursor: 'pointer' }}>← Змінити номер</button>
      )}
    </div>
  );
}

// ─── ClientDashboard ────────────────────────────────────────────
function ClientDashboard({ onNav }) {
  return (
    <div style={{ ...lexFont, padding: '54px 16px 16px', background: T.bg, minHeight: '100%', overflowY: 'auto' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '0.5px',
        marginBottom: 16 }}>Привіт, Олексій 👋</div>

      <LexAlertBanner type="danger" title="Критично:" text="перевірка ДПС" onClick={() => onNav('inspections')} />
      <LexAlertBanner type="brand" title="Засідання:" text="12 травня, 10:00" onClick={() => onNav('cases')} />
      <LexAlertBanner type="warning" title="До сплати:" text="₴24 500" onClick={() => onNav('invoices')} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, marginTop: 4 }}>
        <LexStatCard icon="⚖" label="Справи" value={4} />
        <LexStatCard icon="🔍" label="Перевірки" value={2} />
        <LexStatCard icon="💰" label="Рахунки" value={1} />
      </div>

      <LexSectionLabel>Швидкий доступ</LexSectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Справи', icon: '⚖', key: 'cases' },
          { label: 'Перевірки', icon: '🔍', key: 'inspections' },
          { label: 'Реєстри', icon: '🗂', key: 'registry' },
          { label: 'Бюро', icon: '👨‍⚖️', key: 'bureau' },
          { label: 'Чат', icon: '💬', key: 'chat' },
          { label: 'Документи', icon: '📄', key: 'documents' },
        ].map(item => (
          <button key={item.key} onClick={() => onNav(item.key)}
            style={{ ...lexFont, width: 'calc(33.33% - 6px)', background: T.raised,
              border: `1px solid ${T.borderSubtle}`, borderRadius: 10, padding: '14px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: T.text, cursor: 'pointer' }}>
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>

      <LexSectionLabel>Активні справи</LexSectionLabel>
      <LexCard onClick={() => onNav('caseDetail')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>Захист прав на ТМ</div>
          <LexBadge status="active" />
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>Госп. суд Києва · № 761/2024</div>
        <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2, marginBottom: 8 }}>Засідання: 12 травня 2025</div>
        <LexProgressBar progress={65} />
      </LexCard>
    </div>
  );
}

// ─── MyCases ────────────────────────────────────────────────────
function MyCases({ onNav }) {
  const cases = [
    { id: 1, title: 'Захист прав на ТМ', court: 'Госп. суд Києва', num: '№ 761/2024', hearing: '12 травня', status: 'active', progress: 65 },
    { id: 2, title: 'Корп. спір з ТОВ "Лідер"', court: 'Печерський суд', num: '№ 757/2025', hearing: '24 травня', status: 'pending', progress: 35 },
    { id: 3, title: 'Оскарження штрафу ДПС', court: 'ОАС Києва', num: '№ 320/2025', hearing: null, status: 'active', progress: 20 },
  ];
  return (
    <div style={{ ...lexFont, padding: '54px 16px 16px', background: T.bg, minHeight: '100%' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '0.5px', marginBottom: 12 }}>Мої справи</div>
      <div style={{ marginBottom: 14 }}>
        <LexInput placeholder="Пошук за назвою, номером, судом..." />
      </div>
      {cases.map(c => (
        <div key={c.id} style={{ marginBottom: 12 }}>
          <LexCard onClick={() => onNav('caseDetail')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{c.title}</div>
              <LexBadge status={c.status} />
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>{c.court} · {c.num}</div>
            {c.hearing && <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2, marginBottom: 8 }}>Засідання: {c.hearing}</div>}
            {!c.hearing && <div style={{ height: 8 }} />}
            <LexProgressBar progress={c.progress} />
          </LexCard>
        </div>
      ))}
    </div>
  );
}

// ─── CaseDetail ─────────────────────────────────────────────────
function CaseDetail({ onBack }) {
  const events = [
    { date: '12.03.2025 10:00', actor: 'Адвокат', text: 'Подано позовну заяву до госп. суду' },
    { date: '25.03.2025 14:30', actor: 'Суд', text: 'Відкрито провадження у справі' },
    { date: '08.04.2025 09:00', actor: 'Опонент', text: 'Подано відзив на позов' },
  ];
  return (
    <div style={{ ...lexFont, padding: '54px 16px 16px', background: T.bg, minHeight: '100%', overflowY: 'auto' }}>
      <LexScreenHeader title="Захист прав на ТМ" onBack={onBack} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: T.textSecondary }}>Госп. суд Києва · № 761/2024</span>
        <LexBadge status="active" />
      </div>
      <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 14 }}>Категорія: Інтелектуальна власність · Інстанція: Перша</div>
      <LexSectionLabel>Прогрес</LexSectionLabel>
      <LexProgressBar progress={65} />
      <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 6, marginBottom: 18 }}>65% виконано</div>

      <LexSectionLabel>Хронологія подій</LexSectionLabel>
      {events.map((e, i) => (
        <LexCard key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.brand, marginBottom: 4 }}>{e.date}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 6 }}>{e.actor}</div>
          <div style={{ fontSize: 14, color: T.text }}>{e.text}</div>
        </LexCard>
      ))}
      <div style={{ marginTop: 16 }}>
        <LexButton variant="ghost">Документи справи</LexButton>
      </div>
    </div>
  );
}

// ─── ChatScreen ─────────────────────────────────────────────────
function ChatScreen({ onBack }) {
  const [messages, setMessages] = useState_s([
    { mine: false, text: 'Добрий день! Підготував відзив для суду.' },
    { mine: true, text: 'Дякую! Коли наступне засідання?' },
    { mine: false, text: '12 травня о 10:00, буду присутній.' },
  ]);
  const [text, setText] = useState_s('');
  const send = () => {
    if (!text.trim()) return;
    setMessages([...messages, { mine: true, text: text.trim() }]);
    setText('');
    setTimeout(() => {
      setMessages(m => [...m, { mine: false, text: 'Прийняв, опрацюю до кінця дня.' }]);
    }, 700);
  };
  return (
    <div style={{ ...lexFont, display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
      <div style={{ padding: '54px 16px 12px', borderBottom: `1px solid ${T.borderSubtle}` }}>
        <LexScreenHeader title="Чат з адвокатом" onBack={onBack} />
      </div>
      <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.map((m, i) => <LexChatBubble key={i} mine={m.mine}>{m.text}</LexChatBubble>)}
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${T.borderSubtle}`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <LexInput placeholder="Повідомлення..." value={text} onChange={setText} />
        </div>
        <button onClick={send} style={{
          width: 40, height: 40, borderRadius: 20, border: 'none', background: T.brand,
          color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        }}>↑</button>
      </div>
    </div>
  );
}

// ─── MyInvoices ─────────────────────────────────────────────────
function MyInvoices() {
  const [filter, setFilter] = useState_s('Всі');
  const all = [
    { id: 1, title: 'Консультація з ТМ', num: '№ 42', date: '01.04.2025', amount: 8000, status: 'pending' },
    { id: 2, title: 'Судовий супровід, квітень', num: '№ 38', date: '01.04.2025', amount: 16500, status: 'overdue' },
    { id: 3, title: 'Реєстрація компанії', num: '№ 31', date: '15.03.2025', amount: 12000, status: 'paid' },
  ];
  const visible = filter === 'Всі' ? all
    : filter === 'Очікують' ? all.filter(i => i.status === 'pending')
    : filter === 'Оплачено' ? all.filter(i => i.status === 'paid')
    : all.filter(i => i.status === 'overdue');
  const total = all.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
  return (
    <div style={{ ...lexFont, padding: '54px 16px 16px', background: T.bg, minHeight: '100%' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '0.5px', marginBottom: 12 }}>Мої рахунки</div>
      <LexCard style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.brand, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>До сплати</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: T.text }}>₴{total.toLocaleString('uk-UA').replace(/,/g, ' ')}</div>
      </LexCard>
      <LexFilterTabs options={['Всі', 'Очікують', 'Оплачено', 'Прострочено']} active={filter} onChange={setFilter} />
      {visible.map(i => (
        <LexCard key={i.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{i.title}</div>
            <LexBadge status={i.status} />
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>{i.num} · {i.date}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.brand, marginTop: 8 }}>₴{i.amount.toLocaleString('uk-UA').replace(/,/g, ' ')}</div>
        </LexCard>
      ))}
    </div>
  );
}

// ─── MyDocuments ────────────────────────────────────────────────
function MyDocuments() {
  const docs = [
    { name: 'Позовна заява.pdf', size: '184 КБ', date: '12.03.2025' },
    { name: 'Відзив на позов.pdf', size: '92 КБ', date: '08.04.2025' },
    { name: 'Договір про надання послуг.pdf', size: '256 КБ', date: '02.02.2025' },
  ];
  return (
    <div style={{ ...lexFont, padding: '54px 16px 16px', background: T.bg, minHeight: '100%' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '0.5px', marginBottom: 16 }}>Документи</div>
      {docs.map((d, i) => (
        <LexListRow key={i}
          avatar={<div style={{ width: 40, height: 40, borderRadius: 10, background: T.base, border: `1px solid ${T.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>}
          title={d.name} subtitle={`${d.size} · ${d.date}`}
          right={<span style={{ color: T.textSecondary, fontSize: 18 }}>›</span>}
          onClick={() => {}} />
      ))}
    </div>
  );
}

// ─── AdminDashboard ─────────────────────────────────────────────
function AdminDashboard({ onNav }) {
  return (
    <div style={{ ...lexFont, padding: '54px 16px 16px', background: T.bg, minHeight: '100%' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '0.5px', marginBottom: 16 }}>Адмін-панель</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <LexStatCard icon="👤" label="Клієнтів" value={12} />
        <LexStatCard icon="📋" label="Звернень" value={3} />
        <LexStatCard icon="💬" label="Чатів" value={2} />
      </div>
      <LexAlertBanner type="warning" title="Непрочитаних:" text="5 повідомлень" onClick={() => onNav('chat')} />
      <LexAlertBanner type="brand" title="Нових звернень:" text="3" onClick={() => onNav('clients')} />

      <LexSectionLabel>Останні чати</LexSectionLabel>
      <LexListRow avatar={<LexAvatar name="Олексій Коваленко" />} title="Олексій К."
        subtitle="Чи готовий відзив?" right={<div style={{ background: T.danger, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>2</div>}
        onClick={() => onNav('chat')} />
      <LexListRow avatar={<LexAvatar name="Марина Шевченко" />} title="Марина Ш."
        subtitle="Дякую за звіт." right={<div style={{ background: T.danger, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>1</div>}
        onClick={() => onNav('chat')} />
    </div>
  );
}

// ─── ClientsList (admin) ────────────────────────────────────────
function ClientsList() {
  const clients = [
    { name: 'Олексій Коваленко', phone: '+380671234567', date: '15.01.2025' },
    { name: 'Марина Шевченко', phone: '+380501112233', date: '02.02.2025' },
    { name: 'Андрій Бондар', phone: '+380937776655', date: '10.03.2025' },
  ];
  return (
    <div style={{ ...lexFont, padding: '54px 16px 16px', background: T.bg, minHeight: '100%' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '0.5px', marginBottom: 12 }}>Клієнти</div>
      <div style={{ marginBottom: 14 }}>
        <LexInput placeholder="Пошук за іменем або телефоном..." />
      </div>
      {clients.map((c, i) => (
        <LexListRow key={i} avatar={<LexAvatar name={c.name} />}
          title={c.name}
          subtitle={`Зареєстровано: ${c.date}`}
          right={<span style={{ fontSize: 12, color: T.brand, fontFamily: "ui-monospace,Menlo,monospace" }}>{c.phone}</span>}
          onClick={() => {}} />
      ))}
    </div>
  );
}

Object.assign(window, {
  LoginScreen, ClientDashboard, MyCases, CaseDetail, ChatScreen,
  MyInvoices, MyDocuments, AdminDashboard, ClientsList,
});
