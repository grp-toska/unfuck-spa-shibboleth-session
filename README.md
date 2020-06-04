# unfuck-spa-shibboleth-session

Fixes common issues related to Shibboleth login in single page applications.

### Resolves three types of issues:

1. _User is reading a page, the session expires behind the scenes. Now when the user wants to continue using the site, there will be silent network errors in the console - leaving the user to wonder "why is this not working?"_

2. _User is filling out important data to a long form and the session expires. This again, causes a silent failure, which the user might not notice - causing hours of work to be wasted._

3. _User logs out of another Shibboleth service, causing the session to expire. This again, causes a silent error._

### How this package fixes these issues:

1. The session is kept alive by pinging a specific URL behind Shibboleth on a set interval. The session is no longer kept alive, when user leaves the browser tab containing the SPA on the background.

2. The status of the Shibboleth session is checked regularly. When the session expires, a prompt is displayed and the page gets overlapped by an overlay. Both indicate that the login session has expired. In order to continue working, the user must log back in a new browser window. Successful login is detected automatically, and no progress will be lost. Is the user wishes to actually logout and lose all unsaved progress, he/she is free to do so.

3. Once again, the status of the Shibboleth session is checked regularly. Importantly, the status of the session is checked immediately, when user re-opens the tab with the single page application.

### How to use this package:

1. Install the package to the frontend of your web-application `npm i unfuck-spa-shibboleth-session@latest`

2. Import the initShibbolethPinger -function `import { initShibbolethPinger } from 'unfuck-spa-shibboleth-session'`

3. Use the imported function in a useEffect -hook, inside of your root container (App.js).

_The initShibbolethPinger -function should be called only once!_

#### Example (App.js):

```

import { initShibbolethPinger } from  'unfuck-spa-shibboleth-session'

useEffect(() => {
    initShibbolethPinger() // Uses default values, which are typically fine.
}, [])
...
```

### Parameters for initShibbolethPinger

| name         | defaultValue         | required? |
| ------------ | -------------------- | --------- |
| pingInterval | 60000 (1 minute)     | false     |
| urlToPing    | window.location.href | false     |

- **pingInterval** - determines how often _urlToPing_ is pinged in order to keep the session alive. Since session validity is also checked while pinging, this also determines how of the session is validated.

- **urlToPing** - an URL address in your application, that should be pinged. This parameters _needs to be set_ if your frontend is **not** located behind Shibboleth.
