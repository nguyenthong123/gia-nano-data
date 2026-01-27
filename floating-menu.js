/**
 * floating-menu.js
 * Hệ thống Menu điều hướng động dựa trên phân quyền người dùng
 */
(function () {
    // 0. Ngăn chặn chạy trong iframe (modal)
    if (window.self !== window.top) return;

    console.log("Floating Menu v3.0 - Loaded at " + new Date().toISOString());


    const AUTH_URL = 'https://script.google.com/macros/s/AKfycbyaz_6xI3Nz0FHnNgr9qEcPuOUGf4OY53l8x1ofSoh_LIGozbKmpSJNAwpq8U6ygpPNHw/exec';

    async function syncPermissions(user) {
        try {
            const res = await fetch(AUTH_URL, {
                method: 'POST',
                body: SecurityProvider.prepareRequest('get_permissions', {
                    email: user.email
                })
            });
            const data = await res.json();
            if (data.success && data.permissions) {
                // Tự động nhận diện nếu Server trả về list (get_phan_quyen) hoặc 1 object (get_permissions)
                let myPerm = {};
                if (data.permissions.data) {
                    const allRoles = data.permissions.data || [];
                    myPerm = allRoles.find(r => r.id_vai_tro === user.roleId) || allRoles[0] || {};
                } else {
                    myPerm = data.permissions;
                }

                // Chuẩn hóa lân cuối: Đảm bảo cả snake_case và camelCase đều hoạt động
                const perms = {
                    ...myPerm,
                    checkinSales: myPerm.checkinSales ?? myPerm.checkin_sales,
                    quanLySanPham: myPerm.quanLySanPham ?? myPerm.quan_ly_san_pham,
                    danhSachDonHang: myPerm.danhSachDonHang ?? myPerm.danh_sach_don_hang,
                    quanLyNhanVien: myPerm.quanLyNhanVien ?? myPerm.quan_ly_nhan_vien,
                    xemBangGia: myPerm.xemBangGia ?? myPerm.xem_bang_gia,
                    quanLyKho: myPerm.quanLyKho ?? myPerm.quan_ly_kho,
                    checkinSummary: myPerm.checkinSummary ?? myPerm.checkin_summary,
                    quanLyCongNo: myPerm.quanLyCongNo ?? myPerm.quan_ly_cong_no,
                    nhapKho: myPerm.nhapKho ?? myPerm.nhap_kho,
                    khoXuatHang: myPerm.khoXuatHang ?? myPerm.kho_xuat_hang,
                    giaoHang: myPerm.giaoHang ?? myPerm.giao_hang,
                    quanLyNhanSu: myPerm.quanLyNhanSu ?? myPerm.quan_ly_nhan_su,
                    priceAnalysis: myPerm.priceAnalysis ?? myPerm.price_analysis,
                    hrSetup: myPerm.hrSetup ?? myPerm.hr_setup,
                    traCuuSanPham: myPerm.traCuuSanPham ?? myPerm.tra_cuu_san_pham,
                    profitAnalysis: myPerm.profitAnalysis ?? myPerm.profit_analysis
                };

                return perms;
            }
        } catch (e) {
            console.error("Floating Menu: Sync perms error", e);
        }
        return null;
    }

    window.refreshDunvexMenu = async function (forceSync = true) {
        // 1. Kiểm tra trạng thái đăng nhập
        const session = typeof SecurityProvider !== 'undefined' ? SecurityProvider.getSession() : null;
        if (!session) return;

        const user = session.user;
        let perms = session.permissions;

        // 2. Đồng bộ quyền từ Sheet nếu cần (để ổn định dữ liệu)
        if (forceSync) {
            const newPerms = await syncPermissions(user);
            if (newPerms) {
                SecurityProvider.saveSession(user, newPerms);
                perms = newPerms;
            }
        }

        const oldMenu = document.getElementById('dunvexFloatingMenu');
        if (oldMenu) oldMenu.remove();

        // 3. Cấu hình Menu
        const menuConfig = [
            {
                category: "KINH DOANH & KHO",
                items: [
                    { id: 'menu_checkin', label: "📊 CRM & Sales", url: "crm-sales.html", perm: 'checkinSales', color: '#EAB308' },
                    { id: 'menu_search_products', label: "🔍 Tra cứu Sản phẩm", url: "tra-cuu-san-pham.html", perm: 'traCuuSanPham', color: '#0ea5e9' },
                    { id: 'menu_products', label: "📦 Quản lý Sản phẩm", url: "quan-ly-san-pham.html", perm: 'quanLySanPham', color: '#3b82f6' },
                    { id: 'menu_list', label: "📋 Danh sách đơn hàng", url: "danh-sach-don-hang.html", perm: 'danhSachDonHang', color: '#64748b' },
                    { id: 'menu_list_pl', label: "🏷️ Danh sách bảng giá", url: "danh-sach-bang-gia.html", perm: 'xemBangGia', color: '#f59e0b' },
                    { id: 'menu_inventory', label: "📊 Quản lý kho vận", url: "quan-ly-kho.html", perm: 'quanLyKho', color: '#22c55e' },
                    { id: 'menu_nhap_kho', label: "📥 Nhập kho hàng", url: "nhap-kho.html", perm: 'nhapKho', color: '#d97706' },
                    { id: 'menu_warehouse', label: "🚚 Kho xuất hàng", url: "kho-xuat-hang.html", perm: 'khoXuatHang', color: '#10b981' },
                    { id: 'menu_delivery', label: "📍 Giao hàng (Tài xế)", url: "tai-xe-giao-hang.html", perm: 'giaoHang', color: '#3b82f6' },
                    { id: 'menu_debt', label: "💰 Theo dõi công nợ", url: "quan-ly-cong-no.html", perm: 'quanLyCongNo', color: '#f59e0b' },
                    { id: 'menu_hr_new', label: "🏢 Quản lý Nhân sự (Mới)", url: "quan-ly-nhan-su.html", perm: 'quanLyNhanSu', color: '#10b981' }
                ]
            }
        ];

        const adminItems = [];
        if (perms?.checkinSummary || user.roleId === 'R001') {
            adminItems.push({ id: 'menu_checkin_summary', label: "📍 Tổng hợp Check-in", url: "admin-checkin-summary.html", perm: 'checkinSummary', color: '#0ea5e9' });
        }
        if (perms?.quanLyNhanVien || user.roleId === 'R001') {
            adminItems.push({ id: 'menu_admin', label: "👥 Quản lý nhân sự", url: "admin-users.html", perm: 'quanLyNhanVien', color: '#64748b' });
        }
        if (perms?.priceAnalysis || user.roleId === 'R001') {
            adminItems.push({ id: 'menu_analysis', label: "📈 Phân tích giá", url: "phan-tich-gia.html", perm: 'priceAnalysis', color: '#22c55e' });
        }
        if (perms?.profitAnalysis || user.roleId === 'R001') {
            adminItems.push({ id: 'menu_profit', label: "📊 Báo cáo Lợi nhuận", url: "bao-cao-loi-nhuan.html", perm: 'profitAnalysis', color: '#22c55e' });
        }

        if (adminItems.length > 0) {
            menuConfig.push({ category: "QUẢN TRỊ VIÊN", items: adminItems });
        }

        if (user.email === 'dunvex.green@gmail.com') {
            menuConfig.length = 0;
            menuConfig.push({
                category: "HỆ THỐNG MASTER",
                items: [{ id: 'menu_master', label: "🛡️ Master Control", url: "super-admin.html", perm: 'isAdmin', color: '#ef4444' }]
            });
        }

        // SUPER AGGRESSIVE CLEANUP: Destroy ALL legacy yellow menu elements found in the DOM
        const legacySelectors = [
            '.floating-menu',
            '.fab-btn',
            '.fab-menu-list',
            '.menu-item',      // Be careful if this is used elsewhere, but in this context it's likely the old menu
            'div[class*="floating-menu"]', // Wildcard matching
            'button[class*="fab-btn"]'
        ];

        legacySelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                console.log("Floating Menu: Destroying legacy element", el);
                el.remove();
            });
        });

        // 4. Tạo cấu trúc DOM
        const menuContainer = document.createElement('div');
        menuContainer.className = 'dunvex-floating-actions';
        menuContainer.id = 'dunvexFloatingMenu';

        let menuContentHtml = `<div class="dunvex-menu-overlay" id="dunvexMenuOverlay">
                                <div class="dunvex-menu-scroll-area">`;

        let itemIndex = 0;
        menuConfig.forEach(cat => {
            let catHtml = `<div class="dunvex-menu-section"><div class="dunvex-menu-header">${cat.category}</div>`;
            let hasVisibleItems = false;

            cat.items.forEach(item => {
                let hasPerm = false;
                if (item.perm === 'isAdmin') {
                    hasPerm = (user.roleId === 'R001');
                } else if (item.perm === 'traCuuSanPham') {
                    hasPerm = (perms && perms[item.perm] !== undefined) ? perms[item.perm] : true;
                } else if (perms && perms[item.perm] !== undefined) {
                    hasPerm = perms[item.perm];
                } else {
                    hasPerm = (user.roleId === 'R001');
                }

                if (hasPerm) {
                    const label = item.label || "";
                    const iconMatch = label.match(/^(\S+)\s+(.*)$/);
                    const icon = iconMatch ? iconMatch[1] : "🔹";
                    const text = iconMatch ? iconMatch[2] : label;

                    const delay = (itemIndex * 0.05) + "s";
                    itemIndex++;

                    catHtml += `
                        <a href="${item.url}" class="dunvex-menu-link" style="--item-color: ${item.color}; --delay: ${delay}">
                            <span class="menu-icon-wrapper">${icon}</span>
                            <span class="menu-text-label">${text}</span>
                        </a>`;
                    hasVisibleItems = true;
                }
            });

            catHtml += `</div>`;
            if (hasVisibleItems) menuContentHtml += catHtml;
        });

        menuContentHtml += `
                    <div class="dunvex-menu-link logout-btn" onclick="handleLogout()" style="--delay: ${(itemIndex * 0.05) + "s"}">
                        <span class="menu-icon-wrapper">🚪</span>
                        <span class="menu-text-label">Đăng xuất</span>
                    </div>
                </div>
            </div>
            <div class="dunvex-float-btn" onclick="toggleDunvexMenu()" id="dunvexMenuTrigger">
                <span class="dv-label">DV</span>
            </div>
        `;

        menuContainer.innerHTML = menuContentHtml;
        document.body.appendChild(menuContainer);

        // Hide older floating actions if present (ID based)
        const oldActions = document.getElementById('mainFloatingActions');
        if (oldActions) oldActions.remove();

        // Kill any legacy class-based floating menus (Yellow Menu)
        document.querySelectorAll('.floating-menu').forEach(el => el.remove());
    };

    // Initialize Menu with a force sync from sheet
    window.refreshDunvexMenu(true);

    // Add Styles (only once)
    if (!document.getElementById('dunvexFloatingMenuStyle')) {
        const style = document.createElement('style');
        style.id = 'dunvexFloatingMenuStyle';
        style.textContent = `
            :root {
                --dv-primary: #FACC15; /* Yellow */
                --dv-bg: #ffffff; /* White background */
                --dv-border: #e2e8f0;
            }
            .dunvex-floating-actions { position: fixed; bottom: 25px; right: 25px; display: flex; flex-direction: column; gap: 12px; z-index: 10000; font-family: 'Inter', -apple-system, sans-serif; }
            
            /* Button DV chính */
            .dunvex-float-btn { 
                width: 65px; height: 65px; border-radius: 50%; 
                background: var(--dv-primary); color: #0f172a; /* Dark Text */ 
                display: flex; align-items: center; justify-content: center; 
                cursor: pointer; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                box-shadow: 0 10px 40px rgba(250, 204, 21, 0.4); /* Yellow Shadow */
                border: 2px solid rgba(255, 255, 255, 0.8); 
            }
            .dunvex-float-btn:active { transform: scale(0.9); }
            .dv-label { font-weight: 900; font-size: 1.6rem; letter-spacing: -1.5px; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .dunvex-float-btn.active { background: #EAB308; } /* Dark Yellow */
            .dunvex-float-btn.active .dv-label { transform: rotate(-15deg) scale(1.15); text-shadow: 0 0 15px rgba(255,255,255,0.4); }

            /* Overlay Menu */
            .dunvex-menu-overlay { 
                position: absolute; bottom: 85px; right: 0; 
                background: var(--dv-bg); 
                /* Removed backdrop-filter as bg is solid white now, but kept if user wants semi-transparency. Let's make it solid for "White" theme look */
                border: 1px solid var(--dv-border); border-radius: 28px; 
                width: 290px; max-width: 85vw; max-height: 70vh;
                display: none; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); 
                transform-origin: bottom right; overflow: hidden;
            }
            .dunvex-menu-overlay.active { display: block; animation: dunvexMenuIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
            
            .dunvex-menu-scroll-area { padding: 18px; max-height: 70vh; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.1) transparent; }
            .dunvex-menu-scroll-area::-webkit-scrollbar { width: 4px; }
            .dunvex-menu-scroll-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }

            @keyframes dunvexMenuIn { 
                from { opacity: 0; transform: scale(0.8) translateY(30px); filter: blur(10px); } 
                to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } 
            }

            /* Item Links */
            .dunvex-menu-header { 
                padding: 12px 16px 8px; font-size: 0.7rem; text-transform: uppercase; 
                letter-spacing: 2.5px; color: #64748b; font-weight: 900; opacity: 1; 
            }
            .dunvex-menu-link { 
                display: flex; align-items: center; gap: 14px; padding: 12px 18px; 
                color: #0f172a; /* Dark Text */
                text-decoration: none; border-radius: 18px; 
                transition: 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); 
                font-weight: 600; cursor: pointer; margin-bottom: 6px;
                background: #f8fafc; border: 1px solid transparent; /* Subtle grey bg */
                opacity: 0; transform: translateY(10px);
            }
            .dunvex-menu-overlay.active .dunvex-menu-link { 
                animation: dunvexItemIn 0.4s forwards; 
                animation-delay: var(--delay);
            }
            
            @keyframes dunvexItemIn {
                to { opacity: 1; transform: translateY(0); }
            }

            .dunvex-menu-link:hover { 
                background: #ffffff; 
                transform: translateX(8px); 
                border-color: #FACC15; /* Yellow border */
                color: #000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            
            .menu-icon-wrapper { 
                font-size: 1.3rem; min-width: 38px; height: 38px; 
                display: flex; align-items: center; justify-content: center; 
                background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
                transition: 0.3s;
            }
            .dunvex-menu-link:hover .menu-icon-wrapper {
                background: var(--item-color, var(--dv-primary));
                transform: scale(1.1) rotate(5deg);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                color: white; /* Conserve white icon on colorful background */
                border-color: transparent;
            }
            
            .menu-text-label { font-size: 0.95rem; }
            .logout-btn { color: #f87171 !important; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 18px; background: white; }
            .logout-btn:hover { background: #fef2f2; border-color: #fca5a5; }

            /* Mobile optimization */
            @media (max-width: 480px) {
                .dunvex-floating-actions { bottom: 20px; right: 20px; }
                .dunvex-menu-overlay { width: calc(100vw - 40px); bottom: 85px; right: 0; }
                .dunvex-float-btn { width: 60px; height: 60px; }
            }
        `;
        document.head.appendChild(style);
    }

    window.toggleDunvexMenu = function () {
        const overlay = document.getElementById('dunvexMenuOverlay');
        const trigger = document.getElementById('dunvexMenuTrigger');
        overlay.classList.toggle('active');
        trigger.classList.toggle('active');
    };

    window.handleLogout = function () {
        if (confirm("Xác nhận đăng xuất khỏi hệ thống?")) {
            if (typeof SecurityProvider !== 'undefined') {
                SecurityProvider.logout();
            } else {
                localStorage.clear();
                window.location.href = 'auth.html';
            }
        }
    };

    window.addEventListener('click', function (e) {
        const overlay = document.getElementById('dunvexMenuOverlay');
        const trigger = document.getElementById('dunvexMenuTrigger');
        if (overlay && overlay.classList.contains('active')) {
            if (!overlay.contains(e.target) && !trigger.contains(e.target)) {
                overlay.classList.remove('active');
            }
        }
    });

})();
