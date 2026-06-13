// LexTrack UI Kit — Components V3 (Light theme + Pantone palette)
// All components reference tokens via inline values mirroring colors_and_type.css.

const { useState, useEffect, useRef } = React;

// ─── Tokens ─────────────────────────────────────────────────────
const T = {
  // surfaces
  bg: '#FFFFFF', base: '#F8F9FA', raised: '#FFFFFF',
  sunken: '#F1F3F4', inverse: '#1B1D1F',
  // borders
  borderSubtle: '#E4E7E9', borderDefault: '#C9CDD0', borderStrong: '#9DA1A4',
  // text
  text: '#1B1D1F', textSecondary: '#5C6164', textTertiary: '#7C8084',
  textDisabled: '#9DA1A4', textInverse: '#FFFFFF',
  // brand
  brand: '#2A8FA8', brandLight: '#4FA9BF', brandDark: '#1F6F84',
  brandMuted: 'rgba(42,143,168,0.12)', brandHover: 'rgba(42,143,168,0.06)',
  brandSecondary: '#7C8084', brandSecondaryDark: '#5C6164',
  brandSecondaryMuted: 'rgba(124,128,132,0.12)',
  // semantic (muted)
  success: '#4A9B6E', successDark: '#366E4F', successBg: 'rgba(74,155,110,0.10)',
  warning: '#C28B3C', warningDark: '#8C622A', warningBg: 'rgba(194,139,60,0.10)',
  danger: '#B84545', dangerDark: '#8A3232', dangerBg: 'rgba(184,69,69,0.10)',
  info: '#3D7AA8', infoDark: '#2A567A', infoBg: 'rgba(61,122,168,0.10)',
  // shadows
  shadow1: '0 1px 2px rgba(15,16,17,0.05), 0 1px 1px rgba(15,16,17,0.04)',
  shadow2: '0 2px 6px rgba(15,16,17,0.06), 0 1px 2px rgba(15,16,17,0.04)',
};

const lexFont = { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" };

// ─── Logo ───────────────────────────────────────────────────────
function LexLogo({ size = 32 }) {
  const markSize = Math.round(size * 1.2);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.35) }}>
      <img src="../../assets/logo.png" width={markSize} height={Math.round(markSize * 0.94)} alt="" style={{ display: 'block' }} />
      <span style={{ ...lexFont, color: T.brand, fontSize: size, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1 }}>LexTrack</span>
    </div>
  );
}

// ─── Button ─────────────────────────────────────────────────────
function LexButton({ children, variant = 'filled', size = 'normal', disabled, onClick, style }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isSmall = size === 'small';
  const bgMap = {
    filled: hover ? T.brandDark : T.brand,
    secondary: hover ? T.brandSecondaryDark : T.brandSecondary,
    ghost: hover ? T.brandHover : 'transparent',
    danger: hover ? T.dangerDark : T.danger,
  };
  const colorMap = {
    filled: '#fff', secondary: '#fff', ghost: T.brand, danger: '#fff',
  };
  const borderMap = {
    filled: 'none', secondary: 'none',
    ghost: `1px solid ${T.brand}`, danger: 'none',
  };
  return (
    <button style={{
      ...lexFont, cursor: disabled ? 'default' : 'pointer',
      fontWeight: 700, fontSize: isSmall ? 12 : 14, borderRadius: 10,
      padding: isSmall ? '7px 14px' : '11px 24px',
      background: bgMap[variant], color: colorMap[variant], border: borderMap[variant],
      opacity: disabled ? 0.4 : (pressed ? 0.85 : 1),
      transition: 'background-color .15s, opacity .12s',
      width: '100%', ...style
    }} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onClick={onClick}>{children}</button>
  );
}

// ─── Input ──────────────────────────────────────────────────────
function LexInput({ placeholder, value, onChange, error, type = 'text', autoFocus }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  const borderColor = error ? T.danger : (focused ? T.brand : T.borderSubtle);
  return (
    <div>
      <div style={{
        background: focused ? '#fff' : T.base,
        border: `1px solid ${borderColor}`,
        borderRadius: 10, padding: '11px 14px',
        boxShadow: focused ? '0 0 0 3px rgba(42,143,168,0.20)' : 'none',
        transition: 'all .15s'
      }}>
        <input ref={ref} type={type} value={value || ''} placeholder={placeholder}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...lexFont, width: '100%', background: 'transparent', border: 'none', outline: 'none',
            color: T.text, fontSize: 14 }} />
      </div>
      {error && <div style={{ ...lexFont, color: T.danger, fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

// ─── Badge ──────────────────────────────────────────────────────
function LexBadge({ status }) {
  const map = {
    'Розглядається': { color: T.brandDark, bg: T.brandMuted, dot: T.brand },
    'Очікує рішення': { color: T.warningDark, bg: T.warningBg, dot: T.warning },
    'Вирішено': { color: T.successDark, bg: T.successBg, dot: T.success },
    'Архів': { color: T.brandSecondaryDark, bg: T.brandSecondaryMuted, dot: T.brandSecondary },
    active: { color: T.successDark, bg: T.successBg, dot: T.success },
    pending: { color: T.warningDark, bg: T.warningBg, dot: T.warning },
    paid: { color: T.successDark, bg: T.successBg, dot: T.success },
    overdue: { color: T.dangerDark, bg: T.dangerBg, dot: T.danger },
    new: { color: T.infoDark, bg: T.infoBg, dot: T.info },
    critical: { color: T.dangerDark, bg: T.dangerBg, dot: T.danger },
  };
  const p = map[status] || { color: T.brandSecondaryDark, bg: T.brandSecondaryMuted, dot: T.brandSecondary };
  return (
    <div style={{ ...lexFont, display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px', borderRadius: 6, background: p.bg, color: p.color,
      fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: p.dot }} />
      {status}
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────
function LexCard({ children, onClick, style }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: T.raised, border: `1px solid ${T.borderSubtle}`, borderRadius: 12,
        padding: 16, cursor: onClick ? 'pointer' : 'default',
        boxShadow: hover && onClick ? T.shadow2 : T.shadow1,
        transition: 'box-shadow .15s, transform .15s',
        transform: hover && onClick ? 'translateY(-1px)' : 'none',
        ...style
      }}>{children}</div>
  );
}

// ─── SectionLabel ───────────────────────────────────────────────
function LexSectionLabel({ children }) {
  return <div style={{ ...lexFont, fontSize: 11, fontWeight: 600, color: T.brand,
    textTransform: 'uppercase', letterSpacing: '1.2px', margin: '4px 0 10px' }}>{children}</div>;
}

// ─── AlertBanner ────────────────────────────────────────────────
function LexAlertBanner({ type = 'brand', title, text, onClick }) {
  const map = {
    danger: { color: T.dangerDark, bg: T.dangerBg, border: T.danger },
    warning: { color: T.warningDark, bg: T.warningBg, border: T.warning },
    brand: { color: T.brandDark, bg: T.brandMuted, border: T.brand },
    success: { color: T.successDark, bg: T.successBg, border: T.success },
    info: { color: T.infoDark, bg: T.infoBg, border: T.info },
  };
  const p = map[type];
  return (
    <div onClick={onClick} style={{
      ...lexFont, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 12,
      background: p.bg, color: p.color, borderLeft: `3px solid ${p.border}`,
      padding: '13px 16px', borderRadius: 10, cursor: onClick ? 'pointer' : 'default',
      fontSize: 14, marginBottom: 10
    }}>
      <span><strong style={{ fontWeight: 700 }}>{title}</strong> {text}</span>
      <span style={{ fontSize: 18, fontWeight: 700, flexShrink: 0 }}>→</span>
    </div>
  );
}

// ─── StatCard ───────────────────────────────────────────────────
function LexStatCard({ icon, label, value }) {
  return (
    <div style={{ ...lexFont, flex: 1, background: T.raised, border: `1px solid ${T.borderSubtle}`,
      borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center',
      boxShadow: T.shadow1 }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{value}</div>
      <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────
function LexAvatar({ name, size = 40, alt }) {
  const initials = (() => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  })();
  return (
    <div style={{ ...lexFont, width: size, height: size, borderRadius: size / 2,
      background: alt ? T.brandSecondary : T.brand, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>{initials}</div>
  );
}

// ─── ProgressBar ────────────────────────────────────────────────
function LexProgressBar({ progress = 0, color = T.brand }) {
  return (
    <div style={{ height: 6, background: T.sunken, borderRadius: 3, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, progress))}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .3s' }} />
    </div>
  );
}

// ─── ScreenHeader ───────────────────────────────────────────────
function LexScreenHeader({ title, onBack }) {
  return (
    <div style={{ ...lexFont, display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 16px' }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: T.text, fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
      )}
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '0.5px' }}>{title}</div>
    </div>
  );
}

// ─── BottomTabs ─────────────────────────────────────────────────
function LexBottomTabs({ tabs, active, onChange }) {
  return (
    <div style={{
      ...lexFont, display: 'flex', background: T.bg,
      borderTop: `1px solid ${T.borderSubtle}`, padding: '6px 0 28px',
    }}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
            style={{
              flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '6px 4px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              color: isActive ? T.brand : T.textTertiary,
              fontFamily: 'inherit',
            }}>
            <span style={{ fontSize: 20, opacity: isActive ? 1 : 0.7 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ChatBubble ─────────────────────────────────────────────────
function LexChatBubble({ mine, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      <div style={{
        ...lexFont, maxWidth: '72%', padding: '10px 14px', fontSize: 14, lineHeight: 1.45,
        background: mine ? T.brand : T.raised, color: mine ? '#fff' : T.text,
        fontWeight: mine ? 500 : 400,
        border: mine ? 'none' : `1px solid ${T.borderSubtle}`,
        boxShadow: mine ? 'none' : T.shadow1,
        borderRadius: 14,
        borderBottomRightRadius: mine ? 4 : 14,
        borderBottomLeftRadius: mine ? 14 : 4,
      }}>{children}</div>
    </div>
  );
}

// ─── ListRow ────────────────────────────────────────────────────
function LexListRow({ avatar, title, subtitle, right, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...lexFont, background: hover && onClick ? T.sunken : T.raised,
        border: `1px solid ${T.borderSubtle}`,
        borderRadius: 10, padding: 14, marginBottom: 10, display: 'flex',
        alignItems: 'center', gap: 12, cursor: onClick ? 'pointer' : 'default',
        boxShadow: T.shadow1, transition: 'background-color .15s' }}>
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── FilterTabs ─────────────────────────────────────────────────
function LexFilterTabs({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          style={{
            ...lexFont, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: active === o ? T.brand : 'transparent',
            color: active === o ? '#fff' : T.textSecondary,
            border: `1px solid ${active === o ? T.brand : T.borderSubtle}`,
            cursor: 'pointer', transition: 'all .15s',
          }}>{o}</button>
      ))}
    </div>
  );
}

Object.assign(window, {
  T, lexFont, LexLogo, LexButton, LexInput, LexBadge, LexCard, LexSectionLabel,
  LexAlertBanner, LexStatCard, LexAvatar, LexProgressBar, LexScreenHeader,
  LexBottomTabs, LexChatBubble, LexListRow, LexFilterTabs,
});
