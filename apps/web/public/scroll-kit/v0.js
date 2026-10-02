/* scroll-kit v0 (experimental). Convenience for the scroll protocol v0; the spec is the contract. */
(function () {
  'use strict'

  var PROTOCOL = 0
  var INIT_TIMEOUT_MS = 3000
  var MAX_QUEUE = 100
  var STORAGE_PREFIX = 'dojo-scroll:'

  var script = window.document && window.document.currentScript
  var attr = function (name) {
    return (script && script.getAttribute(name)) || ''
  }
  var config = {
    id: attr('data-scroll-id'),
    version: attr('data-scroll-version'),
    capabilities: attr('data-capabilities').split(',').map(function (c) { return c.trim() }).filter(Boolean),
  }

  var hostOrigin = readHostOrigin()
  var mode = 'pending'
  var nonce = null
  var session = null
  var initPayload = null
  var queue = []
  var initCallbacks = []
  var localeCallbacks = []
  var themeCallbacks = []

  function readHostOrigin() {
    try {
      var raw = new URLSearchParams(window.location.search).get('host')
      if (!raw) return null
      var url = new URL(raw)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
      return url.origin
    } catch (_e) {
      return null
    }
  }

  function randomNonce() {
    var bytes = new Uint8Array(16)
    window.crypto.getRandomValues(bytes)
    return Array.prototype.map.call(bytes, function (b) { return (b < 16 ? '0' : '') + b.toString(16) }).join('')
  }

  function storageKey(unitId) {
    return STORAGE_PREFIX + config.id + ':' + unitId
  }

  function saveLocal(unitId, patch) {
    try {
      var current = loadUnit(unitId) || { completed: false }
      var next = { completed: patch.completed === undefined ? current.completed : patch.completed }
      var state = patch.state === undefined ? current.state : patch.state
      if (state !== undefined) next.state = state
      window.localStorage.setItem(storageKey(unitId), JSON.stringify(next))
    } catch (_e) {
      /* storage unavailable: progress is not persisted */
    }
  }

  function loadUnit(unitId) {
    try {
      var raw = window.localStorage.getItem(storageKey(unitId))
      return raw ? JSON.parse(raw) : null
    } catch (_e) {
      return null
    }
  }

  function loadAllLocal() {
    var result = {}
    try {
      var prefix = storageKey('')
      for (var i = 0; i < window.localStorage.length; i++) {
        var key = window.localStorage.key(i)
        if (key && key.indexOf(prefix) === 0) {
          var unit = loadUnit(key.slice(prefix.length))
          if (unit) result[key.slice(prefix.length)] = unit
        }
      }
    } catch (_e) {
      /* storage unavailable */
    }
    return result
  }

  function post(message) {
    var envelope = { dojo: 'scroll', v: PROTOCOL }
    if (session) envelope.session = session
    window.parent.postMessage(Object.assign(envelope, message), hostOrigin)
  }

  function apply(op) {
    if (mode === 'embedded') {
      post(op.message)
    } else if (mode === 'standalone' && op.local) {
      saveLocal(op.local.unitId, op.local.patch)
    } else if (mode === 'pending' && queue.length < MAX_QUEUE) {
      queue.push(op)
    }
  }

  function flushQueue() {
    var pending = queue
    queue = []
    pending.forEach(apply)
  }

  function enterStandalone() {
    if (mode !== 'pending') return
    mode = 'standalone'
    initPayload = {
      standalone: true,
      session: null,
      locale: (window.navigator && window.navigator.language) || 'en',
      theme: {},
      progress: loadAllLocal(),
      capabilities: [],
      userRef: null,
      authenticated: false,
    }
    flushQueue()
    initCallbacks.forEach(function (cb) { cb(initPayload) })
  }

  function onMessage(event) {
    if (!hostOrigin || event.source !== window.parent || event.origin !== hostOrigin) return
    var data = event.data
    if (!data || data.dojo !== 'scroll' || data.v !== PROTOCOL) return

    if (data.type === 'init') {
      if (mode !== 'pending' || data.nonce !== nonce) return
      if (typeof data.session !== 'string' || typeof data.locale !== 'string') return
      mode = 'embedded'
      session = data.session
      initPayload = {
        standalone: false,
        session: data.session,
        locale: data.locale,
        theme: data.theme || {},
        progress: data.progress || {},
        capabilities: data.capabilities || [],
        userRef: data.userRef === undefined ? null : data.userRef,
        authenticated: data.authenticated === true,
      }
      flushQueue()
      initCallbacks.forEach(function (cb) { cb(initPayload) })
      return
    }

    if (mode !== 'embedded' || data.session !== session) return
    if (data.type === 'setLocale' && typeof data.locale === 'string') {
      localeCallbacks.forEach(function (cb) { cb(data.locale) })
    } else if (data.type === 'setTheme' && data.theme) {
      themeCallbacks.forEach(function (cb) { cb(data.theme) })
    }
  }

  function start() {
    var framed = window.parent !== window && hostOrigin
    if (!framed) {
      enterStandalone()
      return
    }
    window.addEventListener('message', onMessage)
    nonce = randomNonce()
    try {
      post({
        type: 'hello',
        scroll: { id: config.id, version: config.version },
        nonce: nonce,
        capabilities: config.capabilities,
      })
    } catch (_e) {
      enterStandalone()
      return
    }
    window.setTimeout(enterStandalone, INIT_TIMEOUT_MS)
  }

  function register(list, cb) {
    list.push(cb)
  }

  window.DojoScroll = {
    onInit: function (cb) {
      register(initCallbacks, cb)
      if (initPayload) cb(initPayload)
    },
    onLocale: function (cb) { register(localeCallbacks, cb) },
    onTheme: function (cb) { register(themeCallbacks, cb) },
    progress: function (unitId, state) {
      apply({
        message: { type: 'progress', unitId: unitId, state: state },
        local: { unitId: unitId, patch: { state: state } },
      })
    },
    complete: function (unitId) {
      apply({
        message: { type: 'complete', unitId: unitId },
        local: unitId ? { unitId: unitId, patch: { completed: true } } : null,
      })
    },
    resize: function (height) {
      apply({ message: { type: 'resize', height: Math.max(0, Math.round(height)) } })
    },
    run: function () { return Promise.reject(new Error('capability not available')) },
    llm: function () { return Promise.reject(new Error('capability not available')) },
  }

  start()
})()
