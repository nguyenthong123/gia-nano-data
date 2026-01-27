/**
 * Security Utils for Dunvex App
 * Provides: Throttling, Bot detection, Honeypot, Session Management, and API Security
 */

(function () {
	const lastRequestTime = {};
	const requestCounter = {};
	const PAGE_LOAD_TIME = Date.now();
	let isBot = false;

	// --- CONFIG ---
	const MIN_GAP = 2000;
	const MAX_REQ_PER_MIN = 10;
	const MIN_INTERACT_TIME = 2000;
	const SESSION_TIMEOUT = 12 * 60 * 60 * 1000;
	const STORAGE_KEY = 'dv_secure_app_data';
	const SECRET_KEY = 'dv_client_sec_2025';
	const API_SECRET = 'dv_api_secret_2025_prod_v2'; // Must match backend

	function xorCipher(text) {
		if (!text) return "";
		let result = "";
		for (let i = 0; i < text.length; i++) {
			result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
		}
		return btoa(unescape(encodeURIComponent(result)));
	}

	function xorDecipher(encoded) {
		if (!encoded) return "";
		try {
			let text = decodeURIComponent(escape(atob(encoded)));
			let result = "";
			for (let i = 0; i < text.length; i++) {
				result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
			}
			return result;
		} catch (e) { return ""; }
	}

	function setupHoneypot() {
		const forms = document.querySelectorAll('form');
		forms.forEach(form => {
			if (!form.querySelector('.dv-hp-field')) {
				const hp = document.createElement('div');
				hp.style.display = 'none';
				hp.className = 'dv-hp-field';
				hp.innerHTML = `<input type="text" name="dv_hp_email" tabindex="-1" autocomplete="off" value="">`;
				form.prepend(hp);
			}
		});
	}

	window.SecurityProvider = {
		saveSession: function (userData, permissions) {
			const session = { user: userData, permissions: permissions, timestamp: Date.now() };
			localStorage.setItem(STORAGE_KEY, xorCipher(JSON.stringify(session)));
			localStorage.removeItem('user'); localStorage.removeItem('permissions');
		},

		getSession: function () {
			const encrypted = localStorage.getItem(STORAGE_KEY);
			if (!encrypted) return null;
			const decrypted = xorDecipher(encrypted);
			if (!decrypted) return null;
			try {
				const session = JSON.parse(decrypted);
				if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
					this.logout(); return null;
				}
				return session;
			} catch (e) { return null; }
		},

		logout: function () {
			localStorage.removeItem(STORAGE_KEY);
			if (!window.location.pathname.endsWith('auth.html')) window.location.href = 'auth.html';
		},

		validateAccess: function () {
			const session = this.getSession();
			const isAuthPage = window.location.pathname.endsWith('auth.html');
			if (!session && !isAuthPage) window.location.href = 'auth.html';
			else if (session && isAuthPage) window.location.href = 'index.html';
			return session;
		},

		prepareRequest: function (action, data = {}) {
			return JSON.stringify({
				...data,
				action: action,
				apiKey: API_SECRET,
				clientTime: Date.now()
			});
		},

		check: function (action) {
			const now = Date.now();
			const hpFields = document.querySelectorAll('input[name="dv_hp_email"]');
			for (let field of hpFields) { if (field.value !== "") return false; }
			if (now - PAGE_LOAD_TIME < MIN_INTERACT_TIME) return false;
			if (lastRequestTime[action] && (now - lastRequestTime[action] < MIN_GAP)) {
				this.notify('Bạn đang thao tác quá nhanh...'); return false;
			}
			const oneMinAgo = now - 60000;
			if (!requestCounter[action]) requestCounter[action] = [];
			requestCounter[action] = requestCounter[action].filter(time => time > oneMinAgo);
			if (requestCounter[action].length >= MAX_REQ_PER_MIN) {
				this.notify('Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.'); return false;
			}
			lastRequestTime[action] = now;
			requestCounter[action].push(now);
			return true;
		},

		notify: function (msg) {
			if (typeof window.showToast === 'function') window.showToast(msg, true);
			else if (typeof window.showMsg === 'function') window.showMsg(msg, 'error');
			else alert(msg);
		}
	};

	window.addEventListener('DOMContentLoaded', setupHoneypot);
})();
