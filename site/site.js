const root = document.documentElement
const themeButton = document.querySelector('[data-toggle-theme]')

function updateTheme(theme) {
  root.dataset.theme = theme
  if (themeButton) {
    themeButton.textContent = theme === 'sumi' ? 'View Washi' : 'View Sumi'
    themeButton.setAttribute(
      'aria-label',
      `Switch to ${theme === 'sumi' ? 'Washi light' : 'Sumi dark'} theme`,
    )
  }
  const tokens = getComputedStyle(root)
  for (const label of document.querySelectorAll('[data-token-value]'))
    label.textContent = tokens.getPropertyValue(label.dataset.tokenValue).trim()
  const social = document.querySelector('[data-social-preview]')
  if (social) social.src = `brand/social-${theme}.svg`
}

themeButton?.addEventListener('click', () =>
  updateTheme(root.dataset.theme === 'sumi' ? 'washi' : 'sumi'),
)
updateTheme(root.dataset.theme || 'washi')
