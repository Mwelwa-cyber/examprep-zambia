// ============ Math symbols (Microsoft Word-style) ============
const symbolGroups = {
  'Mathematical Operators': '+ − × ÷ ± ∓ ⊕ ⊖ ⊗ ⊘ = ≠ ≈ ≡ ≢ ≤ ≥ ≪ ≫ < > ¬ ∝ ∴ ∵',
  'Exponents (super)': '⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁺ ⁻ ⁽ ⁾ ⁱ ⁿ',
  'Subscripts': '₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉ ₊ ₋ ₍ ₎ ₐ ᵢ ₙ ₓ',
  'Roots & Calculus': '√ ∛ ∜ ∞ ∫ ∬ ∭ ∮ ∂ ∇ ∑ ∏ ∐ ′ ″ ‴ ƒ',
  'Greek (lower)': 'α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω',
  'Greek (upper)': 'Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο Π Ρ Σ Τ Υ Φ Χ Ψ Ω',
  'Set Theory & Logic': '∈ ∉ ∋ ∌ ⊂ ⊃ ⊆ ⊇ ⊄ ⊅ ⊊ ⊋ ∪ ∩ ∅ ∀ ∃ ∄ ∧ ∨ ⊢ ⊨',
  'Number Sets': 'ℕ ℤ ℚ ℝ ℂ ℙ ℍ ℵ ℶ',
  'Geometry': '° ∠ ⦟ ⊥ ∥ ∦ ≅ ∼ ≃ △ ▱ ▭ ○ ● ⊙ ⊚ ⌒ ∢ ⊿ ▲ ▼ ◆ ◇',
  'Arrows': '← → ↑ ↓ ↔ ↕ ↖ ↗ ↘ ↙ ⇐ ⇒ ⇑ ⇓ ⇔ ⇕ ⇄ ⇆ ⇋ ⇌ ↦ ↩ ↪',
  'Letterlike': 'ℎ ℓ ℘ ℛ ℳ ℒ ℐ ℋ ℰ № ℗ ™ ©',
  'Currency': 'K $ € £ ¥ ¢ ₹ ₽ ₩ ₦ ₱ ₵',
  'Punctuation': '… — – „ “ ” ‘ ’ « » ‹ › † ‡ ¶ § • · ‰',
  'Misc': '★ ☆ ♠ ♣ ♥ ♦ ☼ ☀ ☁ ☂ ⚡ ⚙ ✓ ✗ ✦ ✧'
};
function openSymbolsModal() {
  const body = $('#symbols-modal-body');
  body.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:18px;padding:12px;background:var(--paper-2);border-radius:8px;align-items:center">
      <strong style="font:600 13px var(--font-display);color:var(--ink)">Fraction Builder:</strong>
      <input type="text" id="frac-num" placeholder="Numerator" style="flex:1;padding:6px 10px;border:1px solid var(--line);border-radius:4px;font-family:var(--font-doc);font-size:13px">
      <span>/</span>
      <input type="text" id="frac-den" placeholder="Denominator" style="flex:1;padding:6px 10px;border:1px solid var(--line);border-radius:4px;font-family:var(--font-doc);font-size:13px">
      <button class="btn-solid" id="frac-insert">Insert ⅗</button>
    </div>
    ${Object.entries(symbolGroups).map(([cat, syms]) => `
      <div class="symbol-cat">
        <div class="symbol-cat-name">${cat}</div>
        <div class="symbol-grid">${syms.split(' ').filter(Boolean).map(s => `<button class="sym-btn" data-sym="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      </div>`).join('')}
  `;
  $('#modal-symbols').classList.add('show');
  $$('#symbols-modal-body .sym-btn').forEach(b => {
    b.addEventListener('mousedown', e => e.preventDefault());
    b.addEventListener('click', () => insertSymbol(b.dataset.sym));
  });
  $('#frac-insert').addEventListener('mousedown', e => e.preventDefault());
  $('#frac-insert').addEventListener('click', () => {
    const n = $('#frac-num').value.trim();
    const d = $('#frac-den').value.trim();
    if (!n || !d) { toast('Enter both numerator and denominator'); return; }
    insertFraction(n, d);
    $('#frac-num').value = ''; $('#frac-den').value = '';
  });
}
function insertSymbol(s) {
  if (!editing) $('#btn-edit').click();
  doc.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount || !doc.contains(sel.getRangeAt(0).startContainer)) {
    const r = document.createRange(); r.selectNodeContents(doc); r.collapse(false);
    sel.removeAllRanges(); sel.addRange(r);
  }
  document.execCommand('insertText', false, s);
}
function insertFraction(num, den) {
  if (!editing) $('#btn-edit').click();
  doc.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount || !doc.contains(sel.getRangeAt(0).startContainer)) {
    const r = document.createRange(); r.selectNodeContents(doc); r.collapse(false);
    sel.removeAllRanges(); sel.addRange(r);
  }
  const html = `<span class="frac" contenteditable="false"><span class="num">${esc(num)}</span><span class="den">${esc(den)}</span></span>&nbsp;`;
  document.execCommand('insertHTML', false, html);
}
function __studioInitSymbols() {
  const btn = $('#btn-symbols');
  if (btn) btn.addEventListener('click', openSymbolsModal);
}

window.__studioRebinders = window.__studioRebinders || [];
window.__studioRebinders.push(__studioInitSymbols);
