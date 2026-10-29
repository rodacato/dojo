try {
  var c = localStorage.getItem('dojo-theme')
  var t = c === 'sumi' || c === 'washi' ? c : matchMedia('(prefers-color-scheme: dark)').matches ? 'sumi' : 'washi'
  document.documentElement.setAttribute('data-theme', t)
} catch (e) {}
