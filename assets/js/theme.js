/* eslint-disable no-new */
/* eslint-disable no-undef */
// import { autocomplete } from '@algolia/autocomplete-js'
import * as topbar from 'topbar'

function forEach (elements, handler) {
  elements = elements || []
  for (let i = 0; i < elements.length; i++) handler(elements[i])
}

function getScrollTop () {
  return (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop
}

function isMobileWindow () {
  return window.matchMedia('only screen and (max-width: 680px)').matches
}

/**
 * Animate the element with AnimateCSS. https://animate.style/
 * @param {HTMLElement} element The element to animate.
 * @param {Array} animation The animation selected.
 * @param {boolean} reserved Whether to execute the callback after the animation is ended.
 * @param {function} callback The callback gets exectued after the element is animated.
 */
function animateCSS (element, animation, reserved, callback) {
  if (!Array.isArray(animation)) animation = [animation]
  element.classList.add('animate__animated', ...animation)
  const handler = () => {
    element.classList.remove('animate__animated', ...animation)
    element.removeEventListener('animationend', handler)
    if (typeof callback === 'function') callback()
  }
  if (!reserved) element.addEventListener('animationend', handler)
}
/**
 * Fetch and initialize all SVG icons.
 */
function initSVGIcon () {
  Array.from(document.querySelectorAll('[data-svg-src]')).forEach(icon => {
    fetch(icon.getAttribute('data-svg-src'))
      .then(response => response.text())
      .then(svg => {
        const temp = document.createElement('div')
        temp.insertAdjacentHTML('afterbegin', svg)
        const dataSvg = temp.firstChild
        dataSvg.setAttribute('data-svg-src', icon.getAttribute('data-svg-src'))
        dataSvg.classList.add('icon')
        const titleElements = dataSvg.getElementsByTagName('title')
        if (titleElements.length) dataSvg.removeChild(titleElements[0])
        icon.parentElement.replaceChild(dataSvg, icon)
      })
  })
}

/**
 * Initialize the mobile menu bar.
 */
function initMenuMobile () {
  const menuToggleMobile = document.getElementById('menu-toggle-mobile')
  const menuMobile = document.getElementById('menu-mobile')
  // If no event listener has been registered yet, add one.
  if (!window.menuToggleMobileEventListener) {
    menuToggleMobile.addEventListener('click', () => {
      document.body.classList.toggle('blur')
      menuToggleMobile.classList.toggle('active')
      menuMobile.classList.toggle('active')
    })
    window.menuToggleMobileEventListener = true
  }
  // Remove the mask when click on it.
  window._menuMobileOnClickMask = () => {
    menuToggleMobile.classList.remove('active')
    menuMobile.classList.remove('active')
  }
  window.clickMaskEventSet.add(window._menuMobileOnClickMask)
}

/**
 * Initialize the switch theme button.
 */
function initSwitchTheme () {
  Array.from(document.getElementsByClassName('theme-switch')).forEach(themeSwitch => {
    themeSwitch.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('theme')
      function setColorTheme (theme) {
        document.body.setAttribute('theme', theme)
        window.localStorage && localStorage.setItem('theme', theme)
        window.isDark = !(theme === 'light')
      }
      if (currentTheme === 'dark') {
        setColorTheme('black')
      } else if (currentTheme === 'black') {
        setColorTheme('light')
      } else {
        setColorTheme('dark')
      }
      for (const event of window.switchThemeEventSet) event()
    })
  })
}

/**
 * Initialize the select theme button.
 */
function initSelectTheme () {
  Array.from(document.getElementsByClassName('color-theme-select')).forEach(themeSelect => {
    // Get the current theme
    const currentTheme = document.body.getAttribute('theme')
    // Set the selected Index
    for (let j = 0; j < themeSelect.options.length; j++) {
      const i = themeSelect.options[j]
      if (i.value === currentTheme) {
        themeSelect.selectedIndex = j
        break
      }
    }

    themeSelect.addEventListener('change', () => {
      const theme = themeSelect.value
      window.localStorage && localStorage.setItem('theme', theme)
      if (theme !== 'auto') {
        window.isDark = !(theme === 'light')
        document.body.setAttribute('theme', theme)
      } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.body.setAttribute('theme', 'dark')
          window.isDark = true
        } else {
          document.body.setAttribute('theme', 'white')
          window.isDark = false
        }
      }
      for (const event of window.switchThemeEventSet) event()
    })
  })
}

/**
 * Initialize the search box.
 * @returns {null}
 */
function initSearch () {
  const searchConfig = window.config.search
  const isMobile = window.matchMedia && window.matchMedia('only screen and (max-width: 680px)').matches
  // If there is no search config
  // Or the search has been initialized already
  // Return directly
  if (!searchConfig || (isMobile && window._searchMobileOnce) || (!isMobile && window._searchDesktopOnce)) return

  // Initialize default search config
  const maxResultLength = searchConfig.maxResultLength ? searchConfig.maxResultLength : 10
  const snippetLength = searchConfig.snippetLength ? searchConfig.snippetLength : 50
  const highlightTag = searchConfig.highlightTag ? searchConfig.highlightTag : 'em'
  const isCaseSensitive = searchConfig.isCaseSensitive ? searchConfig.isCaseSensitive : false
  const minMatchCharLength = searchConfig.minMatchCharLength ? searchConfig.minMatchCharLength : 1
  const findAllMatches = searchConfig.findAllMatches ? searchConfig.findAllMatches : false
  const location = searchConfig.location ? searchConfig.location : 0
  const threshold = searchConfig.threshold ? searchConfig.threshold : 0.3
  const distance = searchConfig.distance ? searchConfig.distance : 100
  const ignoreLocation = searchConfig.ignoreLocation ? searchConfig.ignoreLocation : false
  const useExtendedSearch = searchConfig.useExtendedSearch ? searchConfig.useExtendedSearch : false
  const ignoreFieldNorm = searchConfig.ignoreFieldNorm ? searchConfig.ignoreFieldNorm : false
  const suffix = isMobile ? 'mobile' : 'desktop'
  const header = document.getElementById(`header-${suffix}`)
  const searchInput = document.getElementById(`search-input-${suffix}`)
  const searchToggle = document.getElementById(`search-toggle-${suffix}`)
  const searchLoading = document.getElementById(`search-loading-${suffix}`)
  const searchClear = document.getElementById(`search-clear-${suffix}`)

  if (isMobile) {
    window._searchMobileOnce = true
    // Turn on the mask when clicking on the search button
    searchInput.addEventListener('focus', () => {
      document.body.classList.add('blur')
      header.classList.add('open')
    })
    // Turn off the everything when clicking on the cancel button
    document.getElementById('search-cancel-mobile').addEventListener('click', () => {
      header.classList.remove('open')
      document.body.classList.remove('blur')
      document.getElementById('menu-toggle-mobile').classList.remove('active')
      document.getElementById('menu-mobile').classList.remove('active')
      searchLoading.style.display = 'none'
      searchClear.style.display = 'none'
      window._searchMobile && window._searchMobile.autocomplete.setVal('')
    })
    // Clear the search box when clicking on the clear button
    searchClear.addEventListener('click', () => {
      searchClear.style.display = 'none'
      window._searchMobile && window._searchMobile.autocomplete.setVal('')
    }, false)
    // Remove the mask when click on it or pjax:send
    window._searchMobileOnClickMask = () => {
      header.classList.remove('open')
      searchLoading.style.display = 'none'
      searchClear.style.display = 'none'
      window._searchMobile && window._searchMobile.autocomplete.setVal('')
    }
    window.clickMaskEventSet.add(window._searchMobileOnClickMask)
    window.pjaxSendEventSet.add(window._searchMobileOnClickMask)
  } else {
    window._searchDesktopOnce = true
    // Turn on the mask when clicking on the search button
    searchToggle.addEventListener('click', () => {
      document.body.classList.add('blur')
      header.classList.add('open')
      searchInput.focus()
    })
    // Clear the search box when clicking on the clear button
    searchClear.addEventListener('click', () => {
      searchClear.style.display = 'none'
      window._searchDesktop && window._searchDesktop.autocomplete.setVal('')
    })
    // Toggle search when Ctrl + K is pressed
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.code === 'KeyK') {
        e.preventDefault()
        searchToggle.click()
      }
    })
    // Remove the mask when click on it or pjax:send
    window._searchDesktopOnClickMask = () => {
      header.classList.remove('open')
      searchLoading.style.display = 'none'
      searchClear.style.display = 'none'
      window._searchDesktop && window._searchDesktop.autocomplete.setVal('')
    }
    window.clickMaskEventSet.add(window._searchDesktopOnClickMask)
    window.pjaxSendEventSet.add(window._searchDesktopOnClickMask)
  }
  // Reset _searchDesktopOnce when pjax:send
  window.pjaxSendEventSet.add(() => { window._searchDesktopOnce = false; window._searchMobileOnce = false })
  // Display the clear button only when the search box is not empty
  searchInput.addEventListener('input', () => {
    if (searchInput.value === '') searchClear.style.display = 'none'
    else searchClear.style.display = 'inline'
  })

  const initAutosearch = () => {
    const autosearch = autocomplete(`#search-input-${suffix}`, {
      hint: false,
      autoselect: true,
      dropdownMenuContainer: `#search-dropdown-${suffix}`,
      clearOnSelected: true,
      cssClasses: { noPrefix: true },
      debug: true
    }, {
      name: 'search',
      source: (query, callback) => {
        searchLoading.style.display = 'inline'
        searchClear.style.display = 'none'
        const finish = (results) => {
          searchLoading.style.display = 'none'
          searchClear.style.display = 'inline'
          callback(results)
        }
        if (searchConfig.type === 'lunr') {
          const search = () => {
            if (lunr.queryHandler) query = lunr.queryHandler(query)
            const results = {}
            window._index.search(query).forEach(({ ref, matchData: { metadata } }) => {
              const matchData = window._indexData[ref]
              let { uri, title, content: context } = matchData
              if (results[uri]) return
              let position = 0
              Object.values(metadata).forEach(({ content }) => {
                if (content) {
                  const matchPosition = content.position[0][0]
                  if (matchPosition < position || position === 0) position = matchPosition
                }
              })
              position -= snippetLength / 5
              if (position > 0) {
                position += context.substr(position, 20).lastIndexOf(' ') + 1
                context = '...' + context.substr(position, snippetLength)
              } else {
                context = context.substr(0, snippetLength)
              }
              Object.keys(metadata).forEach(key => {
                title = title.replace(new RegExp(`(${key})`, 'gi'), `<${highlightTag}>$1</${highlightTag}>`)
                context = context.replace(new RegExp(`(${key})`, 'gi'), `<${highlightTag}>$1</${highlightTag}>`)
              })
              results[uri] = {
                uri: uri,
                title: title,
                date: matchData.date,
                context: context
              }
            })
            return Object.values(results).slice(0, maxResultLength)
          }
          if (!window._index) {
            fetch(searchConfig.lunrIndexURL)
              .then(response => response.json())
              .then(data => {
                const indexData = {}
                window._index = lunr(function () {
                  if (searchConfig.lunrLanguageCode) this.use(lunr[searchConfig.lunrLanguageCode])
                  this.ref('objectID')
                  this.field('title', { boost: 50 })
                  this.field('tags', { boost: 20 })
                  this.field('categories', { boost: 20 })
                  this.field('content', { boost: 10 })
                  this.metadataWhitelist = ['position']
                  data.forEach((record) => {
                    indexData[record.objectID] = record
                    this.add(record)
                  })
                })
                window._indexData = indexData
                finish(search())
              }).catch(err => {
                console.error(err)
                finish([])
              })
          } else finish(search())
        } else if (searchConfig.type === 'algolia') {
          window._algoliaIndex = window._algoliaIndex || algoliasearch(searchConfig.algoliaAppID, searchConfig.algoliaSearchKey).initIndex(searchConfig.algoliaIndex)
          window._algoliaIndex
            .search(query, {
              offset: 0,
              length: maxResultLength * 8,
              attributesToHighlight: ['title'],
              attributesToRetrieve: ['*'],
              attributesToSnippet: [`content:${snippetLength}`],
              highlightPreTag: `<${highlightTag}>`,
              highlightPostTag: `</${highlightTag}>`
            })
            .then(({ hits }) => {
              const results = {}
              hits.forEach(({ uri, date, _highlightResult: { title }, _snippetResult: { content } }) => {
                if (results[uri] && results[uri].context.length > content.value) return
                results[uri] = {
                  uri: uri,
                  title: title.value,
                  date: date,
                  context: content.value
                }
              })
              finish(Object.values(results).slice(0, maxResultLength))
            })
            .catch(err => {
              console.error(err)
              finish([])
            })
        } else if (searchConfig.type === 'fuse') {
          const search = () => {
            const results = {}
            window._index.search(query).forEach(({ item, refIndex, matches }) => {
              let title = item.title
              let content = item.content
              matches.forEach(({ indices, value, key }) => {
                if (key === 'content') {
                  let offset = 0
                  for (let i = 0; i < indices.length; i++) {
                    const substr = content.substring(indices[i][0] + offset, indices[i][1] + 1 + offset)
                    const tag = `<${highlightTag}>` + substr + `</${highlightTag}>`
                    content = content.substring(0, indices[i][0] + offset) + tag + content.substring(indices[i][1] + 1 + offset, content.length)
                    offset += highlightTag.length * 2 + 5
                  }
                } else if (key === 'title') {
                  let offset = 0
                  for (let i = 0; i < indices.length; i++) {
                    const substr = title.substring(indices[i][0] + offset, indices[i][1] + 1 + offset)
                    const tag = `<${highlightTag}>` + substr + `</${highlightTag}>`
                    title = title.substring(0, indices[i][0] + offset) + tag + title.substring(indices[i][1] + 1 + offset, content.length)
                    offset += highlightTag.length * 2 + 5
                  }
                }
              })
              results[item.uri] = {
                uri: item.uri,
                title: title,
                date: item.date,
                context: content
              }
            })
            return Object.values(results).slice(0, maxResultLength)
          }
          if (!window._index) {
            fetch(searchConfig.fuseIndexURL)
              .then(response => response.json())
              .then(data => {
                const options = {
                  isCaseSensitive: isCaseSensitive,
                  findAllMatches: findAllMatches,
                  minMatchCharLength: minMatchCharLength,
                  location: location,
                  threshold: threshold,
                  distance: distance,
                  ignoreLocation: ignoreLocation,
                  useExtendedSearch: useExtendedSearch,
                  ignoreFieldNorm: ignoreFieldNorm,
                  includeScore: false,
                  shouldSort: true,
                  includeMatches: true,
                  keys: [
                    'content',
                    'title'
                  ]
                }
                window._index = new Fuse(data, options)
                finish(search())
              }).catch(err => {
                console.error(err)
                finish([])
              })
          } else finish(search())
        }
      },
      templates: {
        suggestion: ({ title, date, context }) => `<div><span class="suggestion-title">${title}</span><span class="suggestion-date">${date}</span></div><div class="suggestion-context">${context}</div>`,
        empty: ({ query }) => `<div class="search-empty">${searchConfig.noResultsFound}: <span class="search-query">"${query}"</span></div>`,
        footer: () => {
          const { searchType, icon, href } = searchConfig.type === 'algolia'
            ? {
                searchType: 'algolia',
                icon: '<i class="fab fa-algolia fa-fw"></i>',
                href: 'https://www.algolia.com/'
              }
            : (searchConfig.type === 'lunr'
                ? {
                    searchType: 'Lunr.js',
                    icon: '',
                    href: 'https://lunrjs.com/'
                  }
                : {
                    searchType: 'Fuse.js',
                    icon: '',
                    href: 'https://fusejs.io/'
                  })
          return `<div class="search-footer">Search by <a href="${href}" rel="noopener noreffer" target="_blank">${icon} ${searchType}</a></div>`
        }
      }
    })
    autosearch.on('autocomplete:selected', (_event, suggestion, _dataset, _context) => {
      window.location.assign(suggestion.uri)
    })
    if (isMobile) window._searchMobile = autosearch
    else window._searchDesktop = autosearch
  }
  if (searchConfig.lunrSegmentitURL && !document.getElementById('lunr-segmentit')) {
    const script = document.createElement('script')
    script.id = 'lunr-segmentit'
    script.type = 'text/javascript'
    script.src = searchConfig.lunrSegmentitURL
    script.async = true
    if (script.readyState) {
      script.onreadystatechange = () => {
        if (script.readyState === 'loaded' || script.readyState === 'complete') {
          script.onreadystatechange = null
          initAutosearch()
        }
      }
    } else {
      script.onload = () => {
        initAutosearch()
      }
    }
    document.body.appendChild(script)
  } else initAutosearch()
}

function initDetails () {
  forEach(document.getElementsByClassName('details'), $details => {
    const $summary = $details.getElementsByClassName('details-summary')[0]
    $summary.addEventListener('click', () => {
      $details.classList.toggle('open')
    }, false)
  })
}

function initLightGallery () {
  if (window.config.lightGallery) {
    lightGallery(document.getElementById('content'), window.config.lightGallery)
  }
}

function initHighlight () {
  forEach(document.querySelectorAll('.highlight > pre.chroma'), $preChroma => {
    const $chroma = document.createElement('div')
    $chroma.className = $preChroma.className
    const $table = document.createElement('table')
    $chroma.appendChild($table)
    const $tbody = document.createElement('tbody')
    $table.appendChild($tbody)
    const $tr = document.createElement('tr')
    $tbody.appendChild($tr)
    const $td = document.createElement('td')
    $tr.appendChild($td)
    $preChroma.parentElement.replaceChild($chroma, $preChroma)
    $td.appendChild($preChroma)
  })
  forEach(document.querySelectorAll('.highlight > .chroma'), $chroma => {
    const $codeElements = $chroma.querySelectorAll('pre.chroma > code')
    if ($codeElements.length) {
      const $code = $codeElements[$codeElements.length - 1]
      const $header = document.createElement('div')
      $header.className = 'code-header ' + $code.className.toLowerCase()
      const $title = document.createElement('span')
      $title.classList.add('code-title')
      $title.insertAdjacentHTML('afterbegin', '<i class="arrow fas fa-chevron-right fa-fw"></i>')
      $title.addEventListener('click', () => {
        $chroma.classList.toggle('open')
      }, false)
      $header.appendChild($title)
      const $ellipses = document.createElement('span')
      $ellipses.insertAdjacentHTML('afterbegin', '<i class="fas fa-ellipsis-h fa-fw"></i>')
      $ellipses.classList.add('ellipses')
      $ellipses.addEventListener('click', () => {
        $chroma.classList.add('open')
      }, false)
      $header.appendChild($ellipses)
      const $copy = document.createElement('span')
      $copy.insertAdjacentHTML('afterbegin', '<i class="far fa-copy fa-fw"></i>')
      $copy.classList.add('copy')
      const code = $code.innerText
      if (window.config.code.maxShownLines < 0 || code.split('\n').length < window.config.code.maxShownLines + 2) $chroma.classList.add('open')
      if (window.config.code.copyTitle) {
        $copy.setAttribute('data-clipboard-text', code)
        $copy.title = window.config.code.copyTitle
        const clipboard = new ClipboardJS($copy)
        clipboard.on('success', _e => {
          animateCSS($code, 'animate__flash')
          $copy.firstElementChild.className = 'fas fa-check fa-fw'
          setTimeout(() => {
            $copy.firstElementChild.className = 'far fa-copy fa-fw'
          }, 3000)
        })
        $header.appendChild($copy)
      }
      $chroma.insertBefore($header, $chroma.firstChild)
    }
  })
}

function initTable () {
  forEach(document.querySelectorAll('.content table'), $table => {
    const $wrapper = document.createElement('div')
    $wrapper.className = 'table-wrapper'
    $table.parentElement.replaceChild($wrapper, $table)
    $wrapper.appendChild($table)
  })
}

function initHeaderLink () {
  for (let num = 1; num <= 6; num++) {
    forEach(document.querySelectorAll('.single .content > h' + num), $header => {
      $header.classList.add('headerLink')
      $header.insertAdjacentHTML('afterbegin', `<a href="#${$header.id}" class="header-mark"></a>`)
    })
  }
}

function initToc () {
  const tocCore = document.getElementById('TableOfContents')
  // Return directly if no toc
  if (tocCore === null) return
  const isTocStatic = window.matchMedia && window.matchMedia('only screen and (max-width: 1000px)').matches

  if (document.getElementById('toc-static').getAttribute('kept') || isTocStatic) {
    const tocContentStatic = document.getElementById('toc-content-static')
    if (tocCore.parentElement !== tocContentStatic) {
      tocCore.parentElement.removeChild(tocCore)
      tocContentStatic.appendChild(tocCore)
    }
    if (window._tocOnScroll) window.scrollEventSet.delete(window._tocOnScroll)
  } else {
    const tocContentAuto = document.getElementById('toc-content-auto')
    if (tocCore.parentElement !== tocContentAuto) {
      tocCore.parentElement.removeChild(tocCore)
      tocContentAuto.appendChild(tocCore)
    }
    // The toc element
    const toc = document.getElementById('toc-auto')
    // The page element
    const page = document.getElementsByClassName('page')[0]
    // The rect of the page
    const rect = page.getBoundingClientRect()
    // The toc is 20px to the right of the page
    toc.style.left = `${rect.left + rect.width + 20}px`
    // The toc occupy all the right of the window
    toc.style.maxWidth = `${window.innerWidth - rect.right - 20}px`
    toc.style.visibility = 'visible'
    const tocLinkElements = tocCore.querySelectorAll('a:first-child')
    const tocLiElements = tocCore.getElementsByTagName('li')
    const headerLinkElements = document.getElementsByClassName('headerLink')
    const headerIsFixed = document.body.getAttribute('header-desktop') !== 'normal'
    const headerHeight = document.getElementById('header-desktop').offsetHeight
    const TOP_SPACING = 20 + (headerIsFixed ? headerHeight : 0)
    const minTocTop = toc.offsetTop
    const minScrollTop = minTocTop - TOP_SPACING + (headerIsFixed ? 0 : headerHeight)
    window._tocOnScroll = window._tocOnScroll || (() => {
      const footerTop = document.getElementById('post-footer').offsetTop
      const maxTocTop = footerTop - toc.getBoundingClientRect().height
      const maxScrollTop = maxTocTop - TOP_SPACING + (headerIsFixed ? 0 : headerHeight)
      if (window.newScrollTop < minScrollTop) {
        // If scroll to the top of the page
        // Set toc to absolute
        toc.style.position = 'absolute'
        toc.style.top = `${minTocTop}px`
      } else if (window.newScrollTop > maxScrollTop) {
        // If scroll to the bottom of the page
        // Set toc to absolute
        toc.style.position = 'absolute'
        toc.style.top = `${maxTocTop}px`
      } else {
        // If in the middle
        // Set toc to fixed with TOP_SPACING
        toc.style.position = 'fixed'
        toc.style.top = `${TOP_SPACING}px`
      }
      // Update the active toc link
      // Return directly if no toc link
      if (tocLinkElements.length === 0) return

      let activeTocIndex = -1
      const INDEX_SPACING = TOP_SPACING + window.newScrollTop
      // If the INDEX_SPACING is below the last header link
      // activate the last element
      if (headerLinkElements[headerLinkElements.length - 1].offsetTop < INDEX_SPACING) {
        activeTocIndex = headerLinkElements.length - 1
      } else {
        // Otherwise activate the element that is in between
        // Use offsetTop instead of getBoundingClientRect().top for better performance
        for (let i = 0; i < headerLinkElements.length - 1; i++) {
          const thisTop = headerLinkElements[i].offsetTop
          const nextTop = headerLinkElements[i + 1].offsetTop
          if (thisTop <= INDEX_SPACING && nextTop > INDEX_SPACING) {
            activeTocIndex = i
            break
          }
        }
      }
      // Remove all legacy states
      Array.from(tocLinkElements).forEach(tocLink => tocLink.classList.remove('active'))
      Array.from(tocLiElements).forEach(tocLi => tocLi.classList.remove('has-active'))

      // Set the tocLinkElement to active
      // and all its parent to has-active
      if (activeTocIndex >= 0 && activeTocIndex < tocLinkElements.length) {
        tocLinkElements[activeTocIndex].classList.add('active')
        let parent = tocLinkElements[activeTocIndex].parentElement
        while (parent !== tocCore) {
          parent.classList.add('has-active')
          parent = parent.parentElement.parentElement
        }
      }
      // Update the broswer history
      if (activeTocIndex !== -1) history.replaceState(history.state, null, tocLinkElements[activeTocIndex].href)
    })
    window._tocOnScroll()
    window.scrollEventSet.add(window._tocOnScroll)
  }
}

function initMapbox () {
  if (window.config.mapbox) {
    mapboxgl.accessToken = window.config.mapbox.accessToken
    mapboxgl.setRTLTextPlugin(window.config.mapbox.RTLTextPlugin)
    window._mapboxArr = window._mapboxArr || []
    forEach(document.getElementsByClassName('mapbox'), $mapbox => {
      const { lng, lat, zoom, lightStyle, darkStyle, marked, navigation, geolocate, scale, fullscreen } = window.config.data[$mapbox.id]
      const mapbox = new mapboxgl.Map({
        container: $mapbox,
        center: [lng, lat],
        zoom: zoom,
        minZoom: 0.2,
        style: window.isDark ? darkStyle : lightStyle,
        attributionControl: false
      })
      if (marked) {
        new mapboxgl.Marker().setLngLat([lng, lat]).addTo(mapbox)
      }
      if (navigation) {
        mapbox.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
      }
      if (geolocate) {
        mapbox.addControl(new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          showUserLocation: true,
          trackUserLocation: true
        }), 'bottom-right')
      }
      if (scale) {
        mapbox.addControl(new mapboxgl.ScaleControl())
      }
      if (fullscreen) {
        mapbox.addControl(new mapboxgl.FullscreenControl())
      }
      mapbox.addControl(new MapboxLanguage())
      window._mapboxArr.push(mapbox)
    })
    window._mapboxOnSwitchTheme = () => {
      forEach(window._mapboxArr, mapbox => {
        const $mapbox = mapbox.getContainer()
        const { lightStyle, darkStyle } = window.config.data[$mapbox.id]
        mapbox.setStyle(window.isDark ? darkStyle : lightStyle)
        mapbox.addControl(new MapboxLanguage())
      })
    }
    window.switchThemeEventSet.add(window._mapboxOnSwitchTheme)
  }
}

function initTypeit () {
  if (window.config.typeit) {
    const typeitConfig = window.config.typeit
    const speed = typeitConfig.speed ? typeitConfig.speed : 100
    const cursorSpeed = typeitConfig.cursorSpeed ? typeitConfig.cursorSpeed : 1000
    const cursorChar = typeitConfig.cursorChar ? typeitConfig.cursorChar : '|'
    Object.values(typeitConfig.data).forEach(group => {
      const typeone = (i) => {
        const id = group[i]
        if (!document.getElementById(id).hasAttribute('data-typeit-id')) {
          const instance = new TypeIt(`#${id}`, {
            strings: window.config.data[id],
            speed: speed,
            lifeLike: true,
            cursorSpeed: cursorSpeed,
            cursorChar: cursorChar,
            waitUntilVisible: true,
            afterComplete: () => {
              if (i === group.length - 1) {
                if (typeitConfig.duration >= 0) {
                  window.setTimeout(() => {
                    instance.destroy()
                  }, typeitConfig.duration)
                }
                return
              }
              instance.destroy()
              typeone(i + 1)
            }
          }).go()
        }
      }
      typeone(0)
    })
  }
}

function initMeta () {
  function getMeta (metaName) {
    const metas = document.getElementsByTagName('meta')
    for (let i = 0; i < metas.length; i++) {
      if (metas[i].getAttribute('name') === metaName) {
        return metas[i]
      }
    }
  }
  const themeColorMeta = getMeta('theme-color')
  const metaColors = {
    light: '#f8f8f8',
    dark: '#252627',
    black: '#000000'
  }
  window._metaThemeColorOnSwitchTheme = () => {
    themeColorMeta.content = metaColors[document.body.getAttribute('theme')]
  }
  window.switchThemeEventSet.add(window._metaThemeColorOnSwitchTheme)
  window._metaThemeColorOnSwitchTheme()
}

function onScroll () {
  const $headers = []
  const $viewComments = document.getElementById('view-comments')
  if (document.body.getAttribute('header-desktop') === 'auto') $headers.push(document.getElementById('header-desktop'))
  if (document.body.getAttribute('header-mobile') === 'auto') $headers.push(document.getElementById('header-mobile'))
  if (document.getElementById('comments')) {
    $viewComments.href = '#comments'
    $viewComments.style.display = 'block'
  } else {
    $viewComments.style.display = 'null'
  }
  const $fixedButtons = document.getElementById('fixed-buttons')
  const ACCURACY = 20; const MINIMUM = 100
  function handleScrollEvent () {
    window.newScrollTop = getScrollTop()
    const scroll = window.newScrollTop - window.oldScrollTop
    const isMobile = isMobileWindow()
    forEach($headers, $header => {
      if (scroll > ACCURACY) {
        $header.classList.remove('animate__fadeInDown')
        animateCSS($header, ['animate__fadeOutUp', 'animate__faster'], true)
      } else if (scroll < -ACCURACY || window.newScrollTop <= 20) {
        $header.classList.remove('animate__fadeOutUp')
        animateCSS($header, ['animate__fadeInDown', 'animate__faster'], true)
      }
    })
    if (window.newScrollTop > MINIMUM) {
      if (isMobile && scroll > ACCURACY) {
        $fixedButtons.classList.remove('animate__fadeIn')
        animateCSS($fixedButtons, ['animate__fadeOut', 'animate__faster'], true)
      } else if (!isMobile || scroll < -ACCURACY) {
        $fixedButtons.style.display = 'block'
        $fixedButtons.classList.remove('animate__fadeOut')
        animateCSS($fixedButtons, ['animate__fadeIn', 'animate__faster'], true)
      }
    } else {
      if (!isMobile) {
        $fixedButtons.classList.remove('animate__fadeIn')
        animateCSS($fixedButtons, ['animate__fadeOut', 'animate__faster'], true)
      }
      $fixedButtons.style.display = 'none'
    }
    for (const event of window.scrollEventSet) event()
    window.oldScrollTop = window.newScrollTop
  }
  window.addEventListener('scroll', handleScrollEvent, false)
  document.addEventListener('pjax:send', function () {
    window.removeEventListener('scroll', handleScrollEvent)
  })
}

function onResize () {
  window.addEventListener('resize', () => {
    if (!window._resizeTimeout) {
      window._resizeTimeout = window.setTimeout(() => {
        window._resizeTimeout = null
        for (const event of window.resizeEventSet) event()
        initToc()
        initSearch()
      }, 100)
    }
  }, false)
}

function onClickMask () {
  document.getElementById('mask').addEventListener('click', () => {
    for (const event of window.clickMaskEventSet) event()
    document.body.classList.remove('blur')
  }, false)
}

function init () {
  window.isDark = document.body.getAttribute('theme') !== 'light'
  window.newScrollTop = getScrollTop()
  window.oldScrollTop = window.newScrollTop
  window.scrollEventSet = new Set()
  window.resizeEventSet = new Set()
  window.switchThemeEventSet = new Set()
  window.clickMaskEventSet = new Set()
  window.pjaxSendEventSet = new Set()
  if (window.objectFitImages) objectFitImages()
  initSVGIcon()
  initMenuMobile()
  initSwitchTheme()
  initSelectTheme()
  initMeta()
  initSearch()
  initDetails()
  initLightGallery()
  initHighlight()
  initTable()
  initHeaderLink()
  initTypeit()
  initMapbox()
  initToc()
  onScroll()
  onResize()
  onClickMask()
}

const themeInit = () => {
  init()
}

if (document.readyState !== 'loading') {
  themeInit()
} else {
  document.addEventListener('DOMContentLoaded', themeInit, false)
}

new Pjax({
  selectors: [
    '.pjax-title',
    'main',
    '.menu-item',
    '.pjax-assets',
    '#fixed-buttons',
    '.search-dropdown'
  ],
  scrollTo: false
})

document.addEventListener('pjax:success', function () {
  themeInit()
})

document.addEventListener('pjax:send', function () {
  for (const event of window.pjaxSendEventSet) event()
  for (const event of window.clickMaskEventSet) event()
  document.body.classList.remove('blur')
  delete window._tocOnScroll
  const el = document.getElementById('content')
  if (el) {
    window.lgData[el?.getAttribute('lg-uid')].destroy(true)
  }
  window.scroll(0, 0)
})

topbar.config({
  autoRun: true,
  barThickness: 3,
  barColors: {
    0: '#55bde2'
  },
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, .5)',
  className: 'topbar'
})
document.addEventListener('pjax:send', topbar.show)
document.addEventListener('pjax:complete', topbar.hide)
document.addEventListener('pjax:error', topbar.hide)
