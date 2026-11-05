import { useState, type ReactNode } from "react";
import { MUTED, accent } from "../theme";
import { Field } from "./primitives";
import { t, LANGUAGES } from "../i18n";
import type { Prefs } from "../api";
import type { Section } from "../../core/types";

/** Preference categories. Only categories with real settings are listed: no
 *  empty placeholder tabs. Add a new entry here as a category gains content. */
type Category = "general" | "interface" | "sections";

const CATEGORIES: { id: Category; icon: string }[] = [
  { id: "general", icon: "⚙" },
  { id: "interface", icon: "◧" },
  { id: "sections", icon: "▤" },
];

/** Preferences as a two-pane panel: category list on the left, settings on the
 *  right. Self-contained so the editor only wires `prefs` and `onChange`. */
export function PreferencesPanel({
  prefs,
  onChange,
  sections,
  customHues,
  onSectionHue,
  onResetSectionHue,
  onClose,
}: {
  prefs: Prefs;
  onChange: (p: Partial<Prefs>) => void;
  sections: Section[];
  customHues: Record<string, number>;
  onSectionHue: (id: string, hue: number) => void;
  onResetSectionHue: (id: string) => void;
  onClose: () => void;
}) {
  const [cat, setCat] = useState<Category>("general");

  return (
    <div
      role="dialog"
      aria-label={t("prefs.title")}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: "50%",
        top: 80,
        transform: "translateX(-50%)",
        width: 520,
        maxWidth: "calc(100vw - 32px)",
        background: "var(--panel)",
        color: "var(--ink)",
        border: "1px solid var(--line)",
        borderRadius: 11,
        boxShadow: "0 12px 34px rgba(0,0,0,.30)",
        zIndex: 60,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "8px 11px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <strong style={{ fontSize: ".84rem" }}>{t("prefs.title")}</strong>
        <button
          onClick={onClose}
          title={t("prefs.close")}
          style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: ".9rem" }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", minHeight: 240 }}>
        <nav
          style={{
            width: 150,
            flexShrink: 0,
            borderRight: "1px solid var(--line)",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {CATEGORIES.map((c) => {
            const active = c.id === cat;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                style={{
                  font: "inherit",
                  fontSize: ".82rem",
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  borderRadius: 7,
                  padding: "7px 9px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: active ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
                  color: active ? "var(--accent)" : "var(--ink)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span aria-hidden style={{ fontSize: ".9rem", opacity: 0.85 }}>{c.icon}</span>
                {t(`prefs.cat.${c.id}`)}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1, padding: "12px 16px", minWidth: 0, maxHeight: "min(70vh, 520px)", overflowY: "auto" }}>
          {cat === "general" && <GeneralPane prefs={prefs} onChange={onChange} />}
          {cat === "interface" && <InterfacePane prefs={prefs} onChange={onChange} />}
          {cat === "sections" && (
            <SectionsPane
              sections={sections}
              customHues={customHues}
              onSectionHue={onSectionHue}
              onResetSectionHue={onResetSectionHue}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 14 }}>
      <h4
        style={{
          margin: "0 0 4px",
          fontSize: ".68rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          color: MUTED,
        }}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

function GeneralPane({ prefs, onChange }: { prefs: Prefs; onChange: (p: Partial<Prefs>) => void }) {
  const layout = prefs.layout ?? "horizontal";
  return (
    <>
      <Group title={t("prefs.lang.title")}>
        <select
          value={prefs.lang ?? "en"}
          onChange={(e) => onChange({ lang: e.target.value })}
          style={{ font: "inherit", fontSize: ".82rem", padding: "5px 8px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)" }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </Group>
      <Group title={t("prefs.layout.title")}>
        <div style={{ display: "flex", gap: 6 }}>
          <Segmented label={t("prefs.layout.horizontal")} active={layout === "horizontal"} onClick={() => onChange({ layout: "horizontal" })} />
          <Segmented label={t("prefs.layout.vertical")} active={layout === "vertical"} onClick={() => onChange({ layout: "vertical" })} />
        </div>
        <p style={{ margin: "6px 0 0", fontSize: ".76rem", color: MUTED, lineHeight: 1.5 }}>
          {t("prefs.layout.help")}
        </p>
      </Group>
      <Group title={t("prefs.nav.title")}>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: ".8rem", color: MUTED, lineHeight: 1.7 }}>
          <li>{t("prefs.nav.pan")}</li>
          <li>{t("prefs.nav.box")}</li>
          <li>{t("prefs.nav.connect")}</li>
          <li>{t("prefs.nav.dismiss")}</li>
        </ul>
      </Group>
    </>
  );
}

function Segmented({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        font: "inherit",
        fontSize: ".8rem",
        cursor: "pointer",
        padding: "5px 12px",
        borderRadius: 8,
        border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
        background: active ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

function InterfacePane({ prefs, onChange }: { prefs: Prefs; onChange: (p: Partial<Prefs>) => void }) {
  return (
    <Group title={t("prefs.display.title")}>
      <Field label={t("menu.view.dimMissing")} hint={t("prefs.dimMissing.hint")}>
        <input type="checkbox" checked={prefs.dimMissing} onChange={(e) => onChange({ dimMissing: e.target.checked })} />
      </Field>
      <Field label={t("prefs.dimOpacity")} hint={t("prefs.dimOpacity.hint", { value: Math.round(prefs.dimOpacity * 100) })}>
        <input
          type="range"
          min={0.05}
          max={0.8}
          step={0.05}
          value={prefs.dimOpacity}
          disabled={!prefs.dimMissing}
          onChange={(e) => onChange({ dimOpacity: Number(e.target.value) })}
        />
      </Field>
      <Field label={t("menu.view.colorBySection")}>
        <input
          type="checkbox"
          checked={prefs.edgeColor === "section"}
          onChange={(e) => onChange({ edgeColor: e.target.checked ? "section" : "neutral" })}
        />
      </Field>
      <Field label={t("menu.view.showDeps")}>
        <input type="checkbox" checked={prefs.showDeps} onChange={(e) => onChange({ showDeps: e.target.checked })} />
      </Field>
      <Field label={t("menu.view.hoverPaths")}>
        <input type="checkbox" checked={prefs.hoverHighlight} onChange={(e) => onChange({ hoverHighlight: e.target.checked })} />
      </Field>
      <Field label={t("menu.view.autoGrow")} hint={t("prefs.autoGrow.hint")}>
        <input type="checkbox" checked={prefs.autoGrowBands} onChange={(e) => onChange({ autoGrowBands: e.target.checked })} />
      </Field>
    </Group>
  );
}

function SectionsPane({
  sections,
  customHues,
  onSectionHue,
  onResetSectionHue,
}: {
  sections: Section[];
  customHues: Record<string, number>;
  onSectionHue: (id: string, hue: number) => void;
  onResetSectionHue: (id: string) => void;
}) {
  const ordered = [...sections].sort((a, b) => a.order - b.order);
  return (
    <Group title={t("prefs.sections.title")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ordered.map((s) => {
          const custom = customHues[s.id] !== undefined;
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  aria-hidden
                  style={{ width: 14, height: 14, borderRadius: 4, background: accent(s.hue), border: "1px solid var(--line)", flexShrink: 0 }}
                />
                <span style={{ fontSize: ".82rem", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
                {custom && (
                  <button
                    onClick={() => onResetSectionHue(s.id)}
                    title={t("prefs.sections.resetTip")}
                    style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: ".72rem" }}
                  >
                    {t("prefs.sections.reset")}
                  </button>
                )}
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={s.hue}
                aria-label={t("prefs.sections.hue", { label: s.label })}
                onChange={(e) => onSectionHue(s.id, Number(e.target.value))}
                style={{ width: "100%", accentColor: accent(s.hue) }}
              />
            </div>
          );
        })}
      </div>
    </Group>
  );
}
