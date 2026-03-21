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
const playerButtonWrapperId = 'watch-player-button-wrapper';
const playerButtonId = 'watch-player-button';
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
const tailImage = `<svg width="100%" height="100%" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><linearGradient id="tail-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f1f1f"/><stop offset="1" stop-color="#0b0b0b"/></linearGradient><linearGradient id="tail-accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffcf2d"/><stop offset="1" stop-color="#ffb300"/></linearGradient></defs><rect x="8" y="8" width="112" height="112" rx="26" fill="url(#tail-bg)"/><path d="M52 44L52 84L88 64L52 44Z" fill="url(#tail-accent)"/></svg>`;


const stylesCommon = `
    #watch-player-button-wrapper {
      left: 16px;
      bottom: 16px;
      position: fixed;
      z-index: 8888;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #watch-player-button {
      width: 52px;
      height: 52px;
      outline: none;
      cursor: pointer;
      opacity: 0.95;
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #watch-player-source {
      height: 40px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(20, 20, 20, 0.92);
      color: #f2f2f2;
      font-size: 13px;
      line-height: 40px;
      outline: none;
      cursor: pointer;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35);
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

function attachTailEvents(wrapper) {
    if (wrapper.dataset.bound === '1') {
        return;
    }
    const button = wrapper.querySelector(`#${playerButtonId}`);
    const select = wrapper.querySelector('#watch-player-source');
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
    select.id = 'watch-player-source';
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

function ensureTail(movieId, movieType) {
    let wrapper = document.getElementById(playerButtonWrapperId);
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = playerButtonWrapperId;
        const button = document.createElement('div');
        button.id = playerButtonId;
        button.innerHTML = tailImage;
        const select = createProviderSelect('reyohoho');
        wrapper.appendChild(button);
        wrapper.appendChild(select);
        document.body.appendChild(wrapper);
    }
    wrapper.dataset.movieId = movieId;
    wrapper.dataset.movieType = movieType;
    wrapper.dataset.providerId = wrapper.dataset.providerId || 'reyohoho';
    attachTailEvents(wrapper);
}

function removeTail() {
    const wrapper = document.getElementById(playerButtonWrapperId);
    if (wrapper) {
        wrapper.remove();
    }
}

function kinopoiskPageHandler() {
    const info = getMovieInfo();
    if (!info) {
        console.error('Watch kinopoisk wrong movie data');
        removeTail();
        return;
    }
    if (movieTypes.includes(info.movieType)) {
        ensureTail(info.movieId, info.movieType);
    } else {
        removeTail();
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
