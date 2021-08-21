const headerHeight = 25;
const baseZIndex = 2;
const homePageUrl = 'computer_files/home/index.html';
const desktopSafetyPadding = 10;

var windowBeingDraggedId = '';
var windowXOffset = 0;
var windowYOffset = 0;
var dragging = false;

var desktopDragging = false;
var desktopDragStartX = 0;
var desktopDragStartY = 0;

var allowedToUnfocus = false;

var browserNavigationStack = [];
var navStackHead = 0;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const findAttatchedObjectWithClass = (el, cls) => {
    if (!el.classList.contains(cls)) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    } else {
        return el;
    }
};

const focusWindow = (el) => {
    // Ikkunafokus, päällimmäisyys ja headerin taustaväri
    var allWindows = document.querySelectorAll('.window');
    allWindows.forEach((w) => {
        w.style.zIndex = baseZIndex;
        w.classList.remove('focused');
    });

    // Fokus
    el.style.zIndex = baseZIndex + 1;
    el.classList.add('focused');

    // Rajojen sisäpuolelle positio
    var top = parseInt(el.style.top, 10);
    var left = parseInt(el.style.left, 10);
    var mdiWrapper = document.querySelector('#desktop');

    el.style.top = clamp(top, 0, mdiWrapper.clientHeight - 20) + 'px';
    el.style.left = clamp(left, 0, mdiWrapper.clientWidth - 20) + 'px';

    // Taskbar-elementti
    var tasks = document.querySelectorAll('#taskbar .task');
    tasks.forEach((t) => {
        if (t.getAttribute('data-destination') == el.id) {
            t.classList.add('selected');
        } else {
            t.classList.remove('selected');
        }
    });
};

const unfocus = (e) => {
    if (!allowedToUnfocus) return;

    if (e.target.id == 'desktop' || e.target.id == 'wrapper') {
        // Fokus pois kaikista ikkunoista
        var allWindows = document.querySelectorAll('.window');
        allWindows.forEach((w) => {
            w.style.zIndex = baseZIndex;
            w.classList.remove('focused');
        });

        var tasks = document.querySelectorAll('#taskbar .task');
        tasks.forEach((t) => {
            t.classList.remove('selected');
        });

        var icons = document.querySelectorAll('.desktop-icon');
        icons.forEach((i) => {
            i.classList.remove('selected');
        });
    }
};

var mousedown = (e) => {
    allowedToUnfocus = true;
    // Löydä ikkuna klikatun elementin vanhemmista
    var currentWindow = findAttatchedObjectWithClass(e.target, 'window');
    if (currentWindow != null) {
        // Lasketaan klikkauksen kordinaatit
        var rect = currentWindow.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        // Jos koordinaatit ovat "program headerin" sisäpuolella,
        // laitetaan tiedot ikkunan raahausta varten valmiiksi
        if (y > 0 && y < headerHeight) {
            dragging = true;

            // Ota mouse eventit kaikilta iframeilta raahauksen ajaksi
            document.querySelectorAll('iframe').forEach((ifr) => ifr.classList.add('noevents'));

            currentWindow.classList.add('dragged');
            windowXOffset = x;
            windowYOffset = y;
        }

        focusWindow(currentWindow);
    } else if (e.target.id == 'desktop') {
        desktopDragging = true;

        var selector = document.querySelector('#selector-rect');
        selector.classList.remove('hidden');
        selector.style.left = e.clientX + 'px';
        selector.style.width = '0px';
        selector.style.top = e.clientY + 'px';
        selector.style.height = '0px';

        desktopDragStartX = e.clientX;
        desktopDragStartY = e.clientY;
    }
};

var mouseup = (e) => {
    dragging = false;

    desktopDragging = false;
    document.querySelector('#selector-rect').classList.add('hidden');

    // Mouse eventit takaisin käyttöön iframeille
    document.querySelectorAll('iframe').forEach((ifr) => ifr.classList.remove('noevents'));

    var draggedWindows = document.querySelectorAll('.dragged');
    draggedWindows.forEach((w) => w.classList.remove('dragged'));
};

var mousemove = (e) => {
    if (dragging == true) {
        var mdiWrapper = document.querySelector('#desktop');
        var currentWindow = document.querySelector('.dragged');

        if (currentWindow) {
            currentWindow.style.left =
                clamp(
                    e.clientX - windowXOffset,
                    0,
                    mdiWrapper.clientWidth - currentWindow.clientWidth - 10
                ) + 'px';
            currentWindow.style.top =
                clamp(
                    e.clientY - windowYOffset,
                    0,
                    mdiWrapper.clientHeight - currentWindow.clientHeight - 10
                ) + 'px';
        }
    } else if (desktopDragging) {
        allowedToUnfocus = false;

        var selector = document.querySelector('#selector-rect');

        if (e.clientX >= desktopDragStartX) {
            selector.style.left = desktopDragStartX + 'px';
            selector.style.width = e.clientX - desktopDragStartX + 'px';
        } else if (e.clientX < desktopDragStartX) {
            selector.style.left = e.clientX + 'px';
            selector.style.width = desktopDragStartX - e.clientX + 'px';
        }

        if (e.clientY >= desktopDragStartY) {
            selector.style.top = desktopDragStartY + 'px';
            selector.style.height = e.clientY - desktopDragStartY + 'px';
        } else if (e.clientY < desktopDragStartY) {
            selector.style.top = e.clientY + 'px';
            selector.style.height = desktopDragStartY - e.clientY + 'px';
        }

        // Valitse ikonit
        var icons = document.querySelectorAll('.desktop-icon');
        icons.forEach((i) => {
            console.log(i.offsetLeft);

            if (
                i.offsetLeft + i.clientWidth >= selector.offsetLeft &&
                i.offsetTop + i.clientHeight >= selector.offsetTop &&
                selector.offsetLeft + selector.clientWidth >= i.offsetLeft &&
                selector.offsetTop + selector.clientHeight >= i.offsetTop
            ) {
                i.classList.add('selected');
            } else {
                i.classList.remove('selected');
            }
        });
    }
};

var setSizeLimit = (e) => {
    if (e.target.classList.contains('window')) {
        var mdiWrapper = document.querySelector('#desktop');
        var maxWidth =
            mdiWrapper.clientWidth - parseInt(e.target.style.left, 10) - desktopSafetyPadding;
        var maxHeight =
            mdiWrapper.clientHeight - parseInt(e.target.style.top, 10) - desktopSafetyPadding;

        e.target.style.maxWidth = maxWidth + 'px';
        e.target.style.maxHeight = maxHeight + 'px';
    }
};

document.addEventListener('mousedown', mousedown);
document.addEventListener('mouseup', mouseup);
document.addEventListener('mousemove', mousemove);

var monitor = setInterval(function () {
    var elem = document.activeElement;
    if (elem && elem.tagName == 'IFRAME') {
        clearInterval(monitor);
        focusWindow(findAttatchedObjectWithClass(elem, 'window'));
    }
}, 100);

// Window button eventit -----------

const toggleMaximizeWindow = (e) => {
    var currentWindow = findAttatchedObjectWithClass(e.target, 'window');
    if (currentWindow) {
        currentWindow.classList.toggle('maximized');
    }
};

const minimizeWindow = (e) => {
    var currentWindow = findAttatchedObjectWithClass(e.target, 'window');
    if (currentWindow) {
        currentWindow.classList.add('hidden');
    }

    var tasks = document.querySelectorAll('#taskbar .task');
    tasks.forEach((t) => {
        t.classList.remove('selected');
    });
};

const closeWindow = (e) => {
    var currentWindow = findAttatchedObjectWithClass(e.target, 'window');
    if (currentWindow) {
        currentWindow.classList.add('hidden');
    }

    var tasks = document.querySelectorAll('#taskbar .task');
    tasks.forEach((t) => {
        if (t.getAttribute('data-destination') == currentWindow.id) {
            t.classList.add('hidden');
        }
        t.classList.remove('selected');
    });

    var frame = currentWindow.querySelector('iframe');
    if (frame != null) {
        frame.contentWindow.location.reload();
    }
};

const selectIcon = (icon) => {
    // Lisää valinta itselle
    var icon = findAttatchedObjectWithClass(icon, 'desktop-icon');
    if (!icon) {
        return;
    }

    if (icon.classList.contains('selected')) {
        icon.classList.remove('selected');
    } else {
        // Poista valinta muilta
        var icons = document.querySelectorAll('.desktop-icon');
        icons.forEach((i) => {
            i.classList.remove('selected');
        });

        icon.classList.add('selected');
    }
};

const launchIcon = (e) => {
    var icon = findAttatchedObjectWithClass(e.target, 'desktop-icon');
    if (!icon) {
        return;
    }

    // Poista valinta kaikilta
    var icons = document.querySelectorAll('.desktop-icon');
    icons.forEach((i) => i.classList.remove('selected'));

    var destination = icon.getAttribute('data-destination');
    if (destination != '' && destination) {
        var window = document.getElementById(destination);
        if (window) {
            window.classList.remove('hidden');
            focusWindow(window);

            // Taskbar-elementti näkyviin
            var tasks = document.querySelectorAll('#taskbar .task');
            tasks.forEach((t) => {
                if (t.getAttribute('data-destination') == window.id) {
                    t.classList.remove('hidden');
                }
            });
        }
    }
};

const activateTaskBarItem = (e) => {
    var tasks = document.querySelectorAll('#taskbar .task');
    tasks.forEach((t) => {
        t.classList.remove('selected');
    });

    var task = findAttatchedObjectWithClass(e.target, 'task');
    if (task) {
        var destination = task.getAttribute('data-destination');
        if (destination != '' && destination) {
            var window = document.getElementById(destination);
            if (window) {
                if (window.classList.contains('hidden')) {
                    window.classList.remove('hidden');
                    console.log(window);
                    focusWindow(window);
                    task.classList.add('selected');
                } else if (window.classList.contains('focused')) {
                    window.classList.add('hidden');
                    console.log(window);
                    task.classList.remove('selected');
                } else {
                    focusWindow(window);
                    task.classList.add('selected');
                }
            }
        }
    }
};

const updateNavStack = (url, e) => {
    var browser = findAttatchedObjectWithClass(e.target, 'browser');
    var urlInput = browser.querySelector('.url-bar input');
    urlInput.value = url;

    if (browserNavigationStack[navStackHead] === url) {
        console.log('same');
        return;
    }

    if (navStackHead != 0 && navStackHead < browserNavigationStack.length - 1) {
        console.log('redo');
        browserNavigationStack = browserNavigationStack.slice(0, navStackHead + 1);
    }

    browserNavigationStack.push(url);
    navStackHead = browserNavigationStack.length - 1;
};

const navigateToUrlInput = (e) => {
    var browser = findAttatchedObjectWithClass(e.target, 'browser');
    var urlInput = browser.querySelector('.url-bar input');
    var iFrame = browser.querySelector('iframe');

    iFrame.setAttribute('src', urlInput.value);
};

const navigateToHomePage = (e) => {
    var browser = findAttatchedObjectWithClass(e.target, 'browser');
    var iFrame = browser.querySelector('iframe');

    iFrame.setAttribute('src', homePageUrl);
};

const navigateBack = (e) => {
    var browser = findAttatchedObjectWithClass(e.target, 'browser');
    var iFrame = browser.querySelector('iframe');

    if (typeof browserNavigationStack[navStackHead - 1] != 'undefined') {
        navStackHead--;
        iFrame.setAttribute('src', browserNavigationStack[navStackHead]);
    } else {
        // tyhjää
    }
};

const navigateForward = (e) => {
    var browser = findAttatchedObjectWithClass(e.target, 'browser');
    var iFrame = browser.querySelector('iframe');

    if (typeof browserNavigationStack[navStackHead + 1] != 'undefined') {
        navStackHead++;
        iFrame.setAttribute('src', browserNavigationStack[navStackHead]);
    }
};
