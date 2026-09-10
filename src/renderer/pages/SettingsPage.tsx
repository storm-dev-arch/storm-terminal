import React, { useState } from 'react';
import {
  Palette,
  Activity,
  Terminal,
  Shield,
  Save,
  RotateCcw,
  Check,
  Globe,
  Thermometer,
  Gauge,
  Info,
  Heart,
  Github
} from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS, AppTheme } from '../../shared/types/settings';
import { Language, translations } from '../i18n/translations';
import { STORM_LOGO } from '../assets/logo';

interface SettingsPageProps {
  settings: AppSettings;
  lang: Language;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onNotify: (title: string, msg: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  lang,
  onUpdateSettings,
  onNotify
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const t = translations[lang];

  const handleChange = (key: keyof AppSettings, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await onUpdateSettings(form);
    setSaved(true);
    onNotify(t.savedConfirm, lang === 'ru' ? 'Конфигурация обновлена.' : 'Configuration updated.', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setForm(DEFAULT_SETTINGS);
    onUpdateSettings(DEFAULT_SETTINGS);
    onNotify(lang === 'ru' ? 'Сброс' : 'Reset', lang === 'ru' ? 'Настройки сброшены к исходным.' : 'Restored default settings.', 'info');
  };

  // Reusable tactile segmented pill selector
  const renderSegmented = <T extends string | number>(
    currentVal: T,
    options: { value: T; label: string }[],
    onSelect: (val: T) => void
  ) => (
    <div style={{
      display: 'flex',
      gap: '3px',
      background: 'rgba(255, 255, 255, 0.03)',
      padding: '3px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-subtle)',
      width: '100%'
    }}>
      {options.map((opt) => {
        const isSelected = currentVal === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onSelect(opt.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '11.5px',
              fontWeight: isSelected ? 600 : 400,
              color: isSelected ? '#ffffff' : 'var(--text-secondary)',
              background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: isSelected ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '2px'
      }}>
        <div>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {t.settingsTitle}
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {t.settingsSub}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn-action" onClick={handleReset}>
            <RotateCcw size={12} />
            <span>{t.resetDefaults}</span>
          </button>
          <button className="btn-action btn-primary" onClick={handleSave}>
            {saved ? <Check size={12} /> : <Save size={12} />}
            <span>{saved ? (lang === 'ru' ? 'Сохранено' : 'Saved') : t.saveSettings}</span>
          </button>
        </div>
      </div>

      {/* Appearance & Language Section */}
      <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Palette size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t.sectionAppearance}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Theme selector */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              {t.themeLabel}
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '8px'
            }}>
              {([
                { id: 'dark', name: t.themeDark, bg: '#0d0f12', dot: '#38bdf8' },
                { id: 'slate', name: t.themeSlate, bg: '#0f172a', dot: '#38bdf8' },
                { id: 'oled', name: t.themeOled, bg: '#000000', dot: '#ffffff' },
                { id: 'nord', name: t.themeNord, bg: '#242933', dot: '#88c0d0' },
                { id: 'tokyo', name: t.themeTokyo, bg: '#1a1b26', dot: '#7aa2f7' },
                { id: 'gruvbox', name: t.themeGruvbox, bg: '#282828', dot: '#fabd2f' },
                { id: 'monokai', name: t.themeMonokai, bg: '#221f22', dot: '#ffd866' },
              ] as const).map((th) => {
                const isSelected = form.theme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      handleChange('theme', th.id as AppTheme);
                      onUpdateSettings({ theme: th.id as AppTheme });
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-xs)',
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-hover)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                      }
                    }}
                  >
                    <div style={{
                      width: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: th.dot,
                        boxShadow: isSelected
                          ? `0 0 0 2px var(--bg-card), 0 0 0 3px ${th.dot}`
                          : '0 0 0 1.5px rgba(255, 255, 255, 0.12)',
                        display: 'block'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      lineHeight: '1',
                      flex: 1,
                      textAlign: 'left'
                    }}>
                      {th.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language selector */}
          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <Globe size={12} />
              <span>{t.langLabel}</span>
            </label>
            {renderSegmented(
              form.language,
              [
                { value: 'ru', label: 'Русский' },
                { value: 'en', label: 'English' }
              ],
              (val) => {
                handleChange('language', val);
                onUpdateSettings({ language: val });
              }
            )}
          </div>

          {/* Temperature Units */}
          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <Thermometer size={12} />
              <span>{t.tempUnitLabel}</span>
            </label>
            {renderSegmented(
              form.temperatureUnit,
              [
                { value: 'C', label: t.tempCelsius },
                { value: 'F', label: t.tempFahrenheit }
              ],
              (val) => handleChange('temperatureUnit', val)
            )}
          </div>
        </div>
      </div>

      {/* Terminal Settings */}
      <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Terminal size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t.sectionTerminal}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Cursor Style */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              {t.cursorStyleLabel}
            </label>
            {renderSegmented(
              form.terminalCursorStyle,
              [
                { value: 'block', label: t.cursorBlock },
                { value: 'bar', label: t.cursorBar },
                { value: 'underline', label: t.cursorUnderline }
              ],
              (val) => handleChange('terminalCursorStyle', val)
            )}
          </div>

          {/* Font Size */}
          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              {t.fontSizeLabel}
            </label>
            {renderSegmented(
              form.terminalFontSize,
              [
                { value: 12, label: '12 px' },
                { value: 13, label: '13 px' },
                { value: 14, label: '14 px' },
                { value: 16, label: '16 px' }
              ],
              (val) => handleChange('terminalFontSize', val)
            )}
          </div>
        </div>
      </div>

      {/* Telemetry & Polling Section */}
      <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Activity size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t.sectionTelemetry}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <Gauge size={12} />
              <span>{t.pollingRateLabel}</span>
            </label>
            {renderSegmented(
              form.pollingRateMs,
              [
                { value: 1000, label: '1.0s' },
                { value: 1500, label: '1.5s' },
                { value: 2500, label: '2.5s' },
                { value: 4000, label: '4.0s' }
              ],
              (val) => handleChange('pollingRateMs', val)
            )}
          </div>

          <div>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              {t.graphBufferLabel}
            </label>
            {renderSegmented(
              form.graphHistoryLength,
              [
                { value: 30, label: '30 pts' },
                { value: 40, label: '40 pts' },
                { value: 60, label: '60 pts' },
                { value: 90, label: '90 pts' }
              ],
              (val) => handleChange('graphHistoryLength', val)
            )}
          </div>
        </div>
      </div>

      {/* Windows Integration & Alerts */}
      <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Shield size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t.sectionWindows}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.minimizeToTray}
              onChange={(e) => handleChange('minimizeToTray', e.target.checked)}
              style={{ width: '14px', height: '14px' }}
            />
            <span>{t.minToTray}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.startWithWindows}
              onChange={(e) => handleChange('startWithWindows', e.target.checked)}
              style={{ width: '14px', height: '14px' }}
            />
            <span>{t.startWin}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '12.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.notificationsEnabled}
              onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
              style={{ width: '14px', height: '14px' }}
            />
            <span>{t.enableThermalAlerts}</span>
          </label>

          {form.notificationsEnabled && (
            <div style={{ marginTop: '2px', paddingLeft: '23px' }}>
              <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                {t.thermalThresholdLabel} ({form.tempAlertThreshold}°C)
              </label>
              <input
                type="range"
                min="70"
                max="95"
                step="1"
                value={form.tempAlertThreshold}
                onChange={(e) => handleChange('tempAlertThreshold', parseInt(e.target.value, 10))}
                style={{ width: '220px' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* About STORM TERMINAL / Информация о программе */}
      <div className="surface-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--border-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary-dim)',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src={STORM_LOGO} alt="STORM" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                  STORM TERMINAL
                </h3>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', fontWeight: 600, border: '1px solid var(--border-accent)' }}>
                  v1.2
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {lang === 'ru' ? 'Профессиональный центр мониторинга и диагностики Windows' : 'Professional Windows Hardware Monitor & Diagnostic Center'}
              </span>
            </div>
          </div>

          <div style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}>
            Made by <strong style={{ color: 'var(--accent-primary)' }}>Storm</strong>
          </div>
        </div>

        <div style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-xs)',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          fontSize: '11.5px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>{lang === 'ru' ? 'Разработчик и автор' : 'Author & Developer'}</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '12px' }}>Storm</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>{lang === 'ru' ? 'Архитектура' : 'Architecture'}</span>
            <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Electron 34 • React 18 • TypeScript 5.7</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>{lang === 'ru' ? 'Платформа' : 'Platform'}</span>
            <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Windows 10 / 11 (x64)</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>{lang === 'ru' ? 'Лицензия' : 'License'}</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{lang === 'ru' ? 'Source-Available (Защищенная авторская)' : 'Source-Available (Storm License)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
