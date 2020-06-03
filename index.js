let shibbolethIntervalId
let loginWatcherId
let loginCheckAttemps = 0
let key = 'c75cf8c7-6ad6-4bd2-90e5-0d3ef65c8243'
let value = '8acddd76-a3d0-4bc2-a05d-187c6746e36d'
let overlayClassName = 'e1f4a4c8-6a88-44df-bcbc-cdf4bc698fc7'

import axios from 'axios'

export const initShibbolethPinger = (urlToPing = window.location.href, pingInterval = 60000) => {
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
    // Remove old elements if any
    const elements = document.getElementsByClassName(overlayClassName)
    while (elements.length > 0) elements[0].remove()

    const body = document.getElementsByTagName('body')[0]
    const div = document.createElement('div')
    div.className = overlayClassName
    div.style.backgroundColor = 'gray'
    div.style.height = '100%'
    div.style.width = '100%'
    div.style.position = 'absolute'
    div.style.top = 0
    div.style.opacity = 0.5
    body.appendChild(div)

    var message = document.createElement('H1')
    message.className = overlayClassName
    var messageContent = document.createTextNode("A login page should have opened in a new window. If it did not appear, check your browser's popup-settings.")
    message.appendChild(messageContent)
    message.style.position = 'absolute'
    message.style.top = '25%'
    message.style.padding = '100px'
    message.style.margin = '0 auto'
    message.style.width = '100%'
    message.style.backgroundColor = '#fafafa'
    message.style.textAlign = 'center'

    body.appendChild(message)
  }

  function disableOverlay() {
    document.getElementById(overlayClassName).remove()
  }

  /***
   * This function is useless, if loginwindow.close gets detected correctly.
   */
  function startLoginWatcher() {
    loginWatcherId = setInterval(() => {
      checkReloginStatus()
      loginCheckAttemps += 1
      if (loginCheckAttemps >= 60) {
        // Check at most 60 times (10 minutes)
        clearInterval(loginWatcherId)
      }
    }, 10000)
  }

  function checkReloginStatus() {
    axios
      .get(urlToPing, { validateStatus: null })
      .then((res) => {
        console.log('re-login succeeded')
        clearInterval(loginWatcherId)
        disableOverlay()
      })
      .catch((e) => console.log('re-login not yet succeeded'))
  }

  function checkSessionStatus() {
    axios
      .get(urlToPing, {
        validateStatus: null,
      })
      .catch((error) => {
        if (error.message.toLowerCase() === 'network error') {
          clearInterval(shibbolethIntervalId)
          loginCheckAttemps = 0
          enableOverlay()
          const wantsToLogin = window.confirm('Your login session has expired. Click OK to log back in, or Cancel to lose all unfinished work and log out of the service.')
          const customUrl = `${urlToPing}?${key}=${value}`
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
  }

  function startPinger() {
    if (shibbolethIntervalId) clearInterval(shibbolethIntervalId)
    shibbolethIntervalId = setInterval(checkSessionStatus, pingInterval)
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
      checkSessionStatus()
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
