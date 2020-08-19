let loginWindow
let shibbolethIntervalId
let loginWatcherId
let loginCheckAttemps = 0
let key = 'c75cf8c7-6ad6-4bd2-90e5-0d3ef65c8243'
let value = '8acddd76-a3d0-4bc2-a05d-187c6746e36d'
let overlayClassName = 'e1f4a4c8-6a88-44df-bcbc-cdf4bc698fc7'

import axios from 'axios'

export const initShibbolethPinger = (pingInterval = 60000, urlToPing, onlyPinger = false) => {
  if (!urlToPing) urlToPing = window.location.href

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
    removeOverlay()

    const body = document.getElementsByTagName('body')[0]
    const div = document.createElement('div')
    div.className = overlayClassName
    div.style.backgroundColor = 'gray'
    div.style.height = '100%'
    div.style.width = '100%'
    div.style.position = 'fixed'
    div.style.top = 0
    div.style.opacity = 0.9
    div.style.zIndex = 1000000
    body.appendChild(div)

    const message = document.createElement('H1')
    message.className = overlayClassName
    const messageContent = document.createTextNode("A login page should have opened in a new window. If it did not appear, check your browser's popup-settings.")
    message.appendChild(messageContent)

    const a = document.createElement('a')
    a.href = '' // Just to enable hover pointer.
    const link = document.createTextNode('If the window didnt open, or you closed it by accident - click here.')
    a.appendChild(link)

    a.addEventListener(
      'click',
      function (e) {
        e.preventDefault()
        checkSessionStatus(false)
      },
      false
    )

    const container = document.createElement('div')
    container.className = overlayClassName
    container.style.position = 'fixed'
    container.style.top = '25%'
    container.style.backgroundColor = 'white'
    container.style.padding = '50px'
    container.style.textAlign = 'center'
    container.style.width = '100%'
    container.style.zIndex = 1000001

    container.appendChild(message)
    container.appendChild(a)
    body.appendChild(container)
  }

  function removeOverlay() {
    const elements = document.getElementsByClassName(overlayClassName)
    while (elements.length > 0) elements[0].remove()
  }

  /***
   * This function is useless, if loginwindow.close gets detected correctly.
   */
  function startLoginWatcher() {
    if (loginWatcherId) clearInterval(loginWatcherId)
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
        removeOverlay()
      })
      .catch((e) => console.log('re-login not yet succeeded'))
  }

  function checkSessionStatus(askForConfirmation = true) {
    axios
      .get(urlToPing, {
        validateStatus: null,
      })
      .catch((error) => {
        if (error.message.toLowerCase() === 'network error' && !loginWindow) {
          clearInterval(shibbolethIntervalId)
          if (!onlyPinger) return // Caller application handles the error.
          loginCheckAttemps = 0
          enableOverlay()
          let wantsToLogin = true
          if (askForConfirmation) wantsToLogin = window.confirm('Your login session has expired. Click OK to log back in, or Cancel to lose all unfinished work and log out of the service.')
          const customUrl = `${urlToPing}?${key}=${value}`
          if (wantsToLogin) {
            loginWindow = window.open(customUrl, '_blank', 'width=800,height=700')
            const timer = setInterval(function () {
              if (loginWindow && loginWindow.closed) {
                loginWindow = undefined
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
