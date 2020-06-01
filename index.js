let shibbolethIntervalId

const initShibbolethPinger = (timeoutInterval = 60000) => {
  // Set the name of the hidden property and the change event for visibility
  let hidden
  let visibilityChange

  if (typeof document.hidden !== 'undefined') {
    // Opera 12.10 and Firefox 18 and later support
    hidden = 'hidden'
    visibilityChange = 'visibilitychange'
  } else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden'
    visibilityChange = 'msvisibilitychange'
  } else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden'
    visibilityChange = 'webkitvisibilitychange'
  }

  function startPinger() {
    if (shibbolethIntervalId) clearInterval(shibbolethIntervalId)

    shibbolethIntervalId = setInterval(async () => {
      const res = await fetch(window.location.href)
      console.log(res)
    }, timeoutInterval)
  }

  function handleVisibilityChange() {
    if (document[hidden]) {
      // Tab becomes hidden
      if (shibbolethIntervalId) {
        clearInterval(shibbolethIntervalId)
        shibbolethIntervalId = undefined
      }
    } else {
      // Tab becomes visible again
      startPinger()
    }
  }

  document.addEventListener(visibilityChange, handleVisibilityChange, false)

  // Start pinger on first load
  startPinger()
}

module.exports = {
  initShibbolethPinger,
}
