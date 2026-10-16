try {
  var c = localStorage.getItem('dojo-theme')
  var t = c === 'sumi' || c === 'washi' || c === 'slate' ? c : matchMedia('(prefers-color-scheme: dark)').matches ? 'sumi' : 'washi'
  if (t === 'slate') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', t)
} catch (e) {}
