// ui.js
// Handles UI transitions and menu logic

export function smoothTransition(element, property, to, duration = 300) {
    const from = parseFloat(element.style[property]) || 0;
    const start = Date.now();
    function animate() {
        const now = Date.now();
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        element.style[property] = from + (to - from) * progress;
        if (progress < 1) requestAnimationFrame(animate);
    }
    animate();
}

export function showMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.add('visible');
}

export function hideMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.remove('visible');
}
