
/**
 * Theme Toggle Utility
 * Handles Light/Dark mode switching and persistence.
 */
document.addEventListener('DOMContentLoaded', () => {
	// 1. Initialize Theme
	const storedTheme = localStorage.getItem('theme');
	const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

	if (storedTheme) {
		document.documentElement.setAttribute('data-theme', storedTheme);
	} else if (systemDark) {
		// Optional: explicitly set it if you want to track it, otherwise leave it to CSS media query
		// But for toggling logic simplification, we might want to know the current state.
	}

	// 2. Add Toggle Button to Nav (if nav exists)
	const navAuth = document.querySelector('.nav-auth') || document.querySelector('.nav-actions') || document.querySelector('nav');

	if (navAuth) {
		const toggleBtn = document.createElement('button');
		toggleBtn.className = 'btn-glass theme-toggle-btn';
		toggleBtn.innerHTML = getIcon(getCurrentTheme());
		toggleBtn.title = "Chế độ Sáng/Tối";
		toggleBtn.style.marginLeft = '10px';
		toggleBtn.style.padding = '8px 12px';
		toggleBtn.style.fontSize = '1.2rem';

		toggleBtn.onclick = () => {
			const current = getCurrentTheme();
			const next = current === 'dark' ? 'light' : 'dark';
			document.documentElement.setAttribute('data-theme', next);
			localStorage.setItem('theme', next);
			toggleBtn.innerHTML = getIcon(next);
		};

		// Insert before the first child or append
		if (navAuth.firstChild) {
			navAuth.insertBefore(toggleBtn, navAuth.firstChild);
		} else {
			navAuth.appendChild(toggleBtn);
		}
	}
});

function getCurrentTheme() {
	const attr = document.documentElement.getAttribute('data-theme');
	if (attr) return attr;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getIcon(theme) {
	return theme === 'dark' ? '🌙' : '☀️';
}
