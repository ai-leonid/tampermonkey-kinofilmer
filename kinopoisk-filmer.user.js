// ==UserScript==
// @name         Kinopoisk Filmer
// @namespace    https://github.com/ai-leonid/kinopoisk-filmer/
// @homepage     https://github.com/ai-leonid/kinopoisk-filmer/
// @version      0.6
// @description  Bookmark to film view from kinopoisk.ru
// @author       ai-leonid
// @match        *://*.kinopoisk.ru/*
// @icon         https://github.com/ai-leonid/kinopoisk-filmer/raw/master/images/icon128.png
// @downloadURL  https://github.com/ai-leonid/kinopoisk-filmer/raw/main/kinopoisk-filmer.user.js
// @updateURL    https://github.com/ai-leonid/kinopoisk-filmer/raw/main/kinopoisk-filmer.user.js
// @run-at       document-end
// ==/UserScript==

let lastUrl = location.href;
const ui = {
    wrapperClass: 'kifi-player-button-wrapper',
    buttonClass: 'kifi-player-button',
    selectClass: 'kifi-player-source'
};
const uiSelectors = {
    wrapper: `.${ui.wrapperClass}`,
    button: `.${ui.buttonClass}`,
    select: `.${ui.selectClass}`
};
const movieTypes = ['film', 'series'];
const providers = [
    {
        id: 'reyohoho',
        label: 'Reyohoho',
        buildUrl: (movieId) => `https://dav2010id.github.io/reyohoho/movie/${movieId}`
    },
    {
        id: 'kinohub',
        label: 'Kinohub',
        buildUrl: (movieId) => `https://tv.kinohub.vip/movie/${movieId}`
    },
    {
        id: 'kp-cx',
        label: 'Kinopoisk.cx',
        buildUrl: (movieId, movieType) => `https://www.kinopoisk.cx/${movieType}/${movieId}/`
    },
    {
        id: 'sspoisk',
        label: 'Sspoisk',
        buildUrl: (movieId, movieType) => `https://sspoisk.ru/${movieType}/${movieId}/`
    },
    {
        id: 'kp-plus',
        label: 'Kinopoisk.plus (vpn only)',
        buildUrl: (movieId, movieType) => `https://www.kinopoisk.plus/${movieType}/${movieId}/`
    },
    {
        id: 'kp-fun',
        label: 'Kinopoisk.fun',
        buildUrl: (movieId, movieType) => `https://www.kinopoisk.fun/${movieType}/${movieId}/`
    }
];
const playImage = `<svg width="100%" height="100%" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><linearGradient id="kifi-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#67d985"/><stop offset="1" stop-color="#3a3a3aff"/></linearGradient><linearGradient id="kifi-accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fefefe"/><stop offset="1" stop-color="#e9e1e1ff"/></linearGradient></defs><rect x="8" y="8" width="112" height="112" rx="26" fill="url(#kifi-bg)"/><path d="M52 44L52 84L88 64L52 44Z" fill="url(#kifi-accent)"/></svg>`;


const stylesCommon = `
    ${uiSelectors.wrapper} {
      left: 16px;
      bottom: 16px;
      position: fixed;
      z-index: 8888;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    ${uiSelectors.button} {
      width: 52px;
      height: 52px;
      outline: none;
      cursor: pointer;
      opacity: 0.95;
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    ${uiSelectors.select} {
      height: 40px;
      padding: 0 34px 0 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(20, 20, 20, 0.92);
      color: #f2f2f2;
      font-size: 13px;
      line-height: 40px;
      outline: none;
      cursor: pointer;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%23cfcfcf' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>");
      background-repeat: no-repeat;
      background-position: right 12px center;
    }`;

function mountPlayer(siteUrl) {
    window.open(siteUrl, '_blank');
}

function getProviderById(providerId) {
    return providers.find((provider) => provider.id === providerId) || providers[0];
}

function buildUrl(movieId, movieType, providerId) {
    const provider = getProviderById(providerId);
    return provider.buildUrl(movieId, movieType);
}

function getMovieInfo() {
    const match = window.location.pathname.match(/\/(film|series)\/(\d+)/);
    if (!match) {
        return null;
    }
    return { movieType: match[1], movieId: match[2] };
}

function attachKifiButtonEvents(wrapper) {
    if (wrapper.dataset.bound === '1') {
        return;
    }
    const button = wrapper.querySelector(uiSelectors.button);
    const select = wrapper.querySelector(uiSelectors.select);
    button.addEventListener('click', () => {
        const movieId = wrapper.dataset.movieId;
        const movieType = wrapper.dataset.movieType;
        const providerId = wrapper.dataset.providerId;
        if (movieId && movieType) {
            mountPlayer(buildUrl(movieId, movieType, providerId));
        }
    });
    select.addEventListener('change', (event) => {
        wrapper.dataset.providerId = event.target.value;
    });
    wrapper.dataset.bound = '1';
}

function createProviderSelect(defaultProviderId) {
    const select = document.createElement('select');
    select.className = ui.selectClass;
    providers.forEach((provider) => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = provider.label;
        if (provider.id === defaultProviderId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    return select;
}

function ensureKifiButton(movieId, movieType) {
    let wrapper = document.querySelector(uiSelectors.wrapper);
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = ui.wrapperClass;
        const button = document.createElement('div');
        button.className = ui.buttonClass;
        button.innerHTML = playImage;
        const select = createProviderSelect('reyohoho');
        wrapper.appendChild(button);
        wrapper.appendChild(select);
        document.body.appendChild(wrapper);
    }
    wrapper.dataset.movieId = movieId;
    wrapper.dataset.movieType = movieType;
    wrapper.dataset.providerId = wrapper.dataset.providerId || 'reyohoho';
    attachKifiButtonEvents(wrapper);
}

function removeKifiButton() {
    const wrapper = document.querySelector(uiSelectors.wrapper);
    if (wrapper) {
        wrapper.remove();
    }
}

function kinopoiskPageHandler() {
    const info = getMovieInfo();
    if (!info) {
        console.error('Watch kinopoisk wrong movie data');
        removeKifiButton();
        return;
    }
    if (movieTypes.includes(info.movieType)) {
        ensureKifiButton(info.movieId, info.movieType);
    } else {
        removeKifiButton();
    }
}

new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        kinopoiskPageHandler();
    }
}).observe(document, {
    subtree: true,
    childList: true
});

window.addEventListener('load', kinopoiskPageHandler)

if (typeof GM_addStyle === 'undefined') {
    GM_addStyle = (aCss) => {
        'use strict';
        let head = document.getElementsByTagName('head')[0];
        if (head) {
            let style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.textContent = aCss;
            head.appendChild(style);
            return style;
        }
        return null;
    };
};

if (typeof GM_getResourceText === 'undefined') {
    GM_addStyle(stylesCommon)
} else {
    const styles = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(styles);
}
