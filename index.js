let shibbolethIntervalId
let loginWatcherId
let loginWindow
let key = 'c75cf8c7-6ad6-4bd2-90e5-0d3ef65c8243'
let value = 'secret'
let overLayId = 'e1f4a4c8-6a88-44df-bcbc-cdf4bc698fc7'

import axios from 'axios'

export const initShibbolethPinger = (pingInterval = 60000) => {
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

  function enableOverlay() {
    const body = document.getElementsByTagName('body')[0]
    const div = document.createElement('div')
    div.id = overLayId
    div.style.backgroundColor = 'gray'
    div.style.height = '2000px'
    div.style.width = '2000px'
    div.style.position = 'absolute'
    div.style.top = 0
    div.style.opacity = 0.5
    body.appendChild(div)
  }

  function disableOverlay() {
    document.getElementById(overLayId).remove()
  }

  function startLoginWatcher() {
    loginWatcherId = setInterval(() => {
      checkReloginStatus()
    }, 10000)
  }

  function checkReloginStatus() {
    axios
      .get(window.location.href, { validateStatus: null })
      .then((res) => {
        console.log('re-login succeeded')
        clearInterval(loginWatcherId)
        disableOverlay()
      })
      .catch((e) => console.log('re-login not yet succeeded'))
  }

  function startPinger() {
    if (shibbolethIntervalId) clearInterval(shibbolethIntervalId)

    shibbolethIntervalId = setInterval(() => {
      axios
        .get(window.location.href, {
          validateStatus: null,
        })
        .catch((error) => {
          if (error.message.toLowerCase() === 'network error') {
            clearInterval(shibbolethIntervalId)
            enableOverlay()
            const wantsToLogin = window.confirm('Your login session has expired. Click OK to log back in, or Cancel to lose all unfinished work and log out of the service.')
            const customUrl = `${window.location.href}?${key}=${value}`
            if (wantsToLogin) {
              const loginWindow = window.open(customUrl, '_blank', 'width=800,height=700')
              const timer = setInterval(function () {
                if (loginWindow.closed) {
                  clearInterval(timer)
                  console.log('Login window closed, checking immediately if user actually logged in...')
                  checkReloginStatus()
                }
              }, 1000)
              startLoginWatcher()
            } else {
              window.location.reload(true)
            }
          }
        })
    }, pingInterval)
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

  function checkIfReLogin() {
    const params = new URLSearchParams(window.location.search)
    if (params.has(key) && params.get(key) === value) window.close()
  }

  checkIfReLogin()

  document.addEventListener(visibilityChange, handleVisibilityChange, false)

  // Start pinger on first load
  startPinger()
}
