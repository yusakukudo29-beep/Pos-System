import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://thuamzdhqemgebrixmav.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YAoVXxNBPdP7UT-AtHR_4Q_z9G2InlU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getUserThemeKey() {
    const activeUser = JSON.parse(localStorage.getItem('active_user') || '{}');
    const userEmail = activeUser.email || 'default_user';
    return `pos_theme_${userEmail}`;
}

// ==========================================
// INISIALISASI UTAMA
// ==========================================
// ==========================================
// INISIALISASI UTAMA
// ==========================================
function initApp() {
    let currentPath = window.location.pathname.split("/").pop() || "login.html";
    const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
    
    // Mendukung halaman publik baik dengan .html maupun bersih tanpa .html (Vercel Clean URLs)
    const publicPages = ["login", "login.html", "register", "register.html", ""];

    if (!isLoggedIn && !publicPages.includes(currentPath)) {
        window.location.href = "login.html";
        return;
    }

    const savedTheme = localStorage.getItem(getUserThemeKey()) || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    if (!publicPages.includes(currentPath)) {
        renderLayout(); // Render struktur dasar dulu
        syncUserData(); // Tarik "nama_lengkap" dari tabel user_profile di Supabase

        const navMapping = {
            "dashboard.html": "nav-dashboard",
            "dashboard": "nav-dashboard",
            "penjualan.html": "nav-penjualan",
            "penjualan": "nav-penjualan",
            "barang.html": "nav-barang",
            "barang": "nav-barang",
            "kategori.html": "nav-kategori",
            "kategori": "nav-kategori",
            "report.html": "nav-report",
            "report": "nav-report",
            "users.html": "nav-users",
            "users": "nav-users",
            "userrole.html": "nav-userrole",
            "userrole": "nav-userrole",
            "store.html": "nav-store",
            "store": "nav-store",
            "admin_stores.html": "nav-admin-stores",
            "admin_stores": "nav-admin-stores",
            "metode_pembayaran.html": "nav-metode",
            "metode_pembayaran": "nav-metode"
        };

        if (navMapping[currentPath]) {
            const activeLink = document.getElementById(navMapping[currentPath]);
            if (activeLink) activeLink.classList.add("active");
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
// ==========================================
// FUNGSI TARIK DATA "nama_lengkap" DARI TABEL "user_profile"
// ==========================================
// ==========================================
// FUNGSI TARIK DATA "nama_lengkap" DARI TABEL "user_profile"
// ==========================================
// ==========================================
// FUNGSI TARIK DATA "nama_lengkap" DARI TABEL "user_profile"
// ==========================================
async function syncUserData() {
    const userEmail = localStorage.getItem("user_email") || localStorage.getItem("email");
    
    const updateBadgeText = (text) => {
        const nameElements = document.querySelectorAll('.user-badge-name');
        nameElements.forEach(el => { el.innerText = text; });
    };

    if (!userEmail) {
        updateBadgeText("Pengguna");
        return;
    }

    try {
        const { data, error } = await supabase
            .from('users_profile')
            .select('nama_lengkap')
            .eq('email', userEmail)
            .single();

        // JIKA ADA ERROR, MUNCULKAN POP-UP DI LAYAR TABLET
        if (error) {
            alert("Pesan dari Supabase:\n" + error.message);
            const fallbackName = userEmail.split('@')[0];
            updateBadgeText(fallbackName);
            return;
        }

        if (data && data.nama_lengkap) {
            localStorage.setItem('nama_lengkap', data.nama_lengkap);
            updateBadgeText(data.nama_lengkap);
        } else {
            // POP-UP JIKA DATANYA MEMANG KOSONG
            alert("Tabel berhasil diakses, tapi kolom nama_lengkap Anda di database masih kosong (NULL).");
            updateBadgeText("Pengguna");
        }
    } catch (e) {
        alert("Terjadi kesalahan koneksi:\n" + e.message);
        updateBadgeText("Pengguna");
    }
}

// ==========================================
// FUNGSI RENDER LAYOUT
// ==========================================
// ==========================================
// FUNGSI RENDER LAYOUT (DINAMIS BERDASARKAN HAK AKSES PERMISSIONS)
// ==========================================
export async function renderLayout() {
    const userRole = (localStorage.getItem("user_role") || localStorage.getItem("role") || "").toLowerCase();
    const userEmail = localStorage.getItem("user_email") || localStorage.getItem("email");
    const storeId = await getActiveStoreId();

    let userPermissions = [];
    let isFullAdmin = userRole.includes('super_admin') || userRole.includes('admin_client') || userRole.includes('admin') || userRole.includes('owner');

    if (isFullAdmin) {
        // ✅ TAMBAHAN UNTUK DEVICES: Menambahkan 'devices' ke daftar izin Admin
        userPermissions = ['dashboard', 'penjualan', 'barang', 'kategori', 'report', 'users', 'userrole', 'metode', 'store', 'devices'];
    } else if (userEmail) {
        try {
            const { data: profile } = await supabase.from('users_profile').select('role').eq('email', userEmail).maybeSingle();
            if (profile && profile.role) {
                const { data: roleData } = await supabase.from('roles').select('permissions').eq('store_id', storeId).eq('nama_role', profile.role).maybeSingle();
                if (roleData && roleData.permissions) {
                    let rawPerms = roleData.permissions;
                    if (typeof rawPerms === 'string') {
                        try { userPermissions = JSON.parse(rawPerms); } catch (err) { userPermissions = [rawPerms]; }
                    } else if (Array.isArray(rawPerms)) {
                        userPermissions = rawPerms;
                    }
                }
            }
        } catch (e) {
            console.warn("Gagal memuat permissions sidebar:", e);
        }
    }

    // Normalisasi teks permission dari database ke huruf kecil tanpa spasi/underscore
    const normalizedPerms = userPermissions.map(p => String(p).toLowerCase().replace(/[\s_]+/g, ''));

    // Fungsi pengecekan yang murni membaca izin database tanpa bypass otomatis
    const checkMenuAccess = (keywords) => {
        if (isFullAdmin) return true;
        return keywords.some(kw => normalizedPerms.some(p => p.includes(kw)));
    };

    // ==============================================================
    // 🛡️ PROTEKSI URL / ROUTE GUARD & SMART REDIRECT
    // ==============================================================
    const currentPathGuard = window.location.pathname.split("/").pop();
    let hasAccess = true;

    const pagePermissions = {
        "penjualan": ['penjualan', 'kasir', 'bukakasir'],
        "penjualan.html": ['penjualan', 'kasir', 'bukakasir'],
        "dashboard": ['dashboard', 'lihatdashboard'],
        "dashboard.html": ['dashboard', 'lihatdashboard'],
        "barang": ['barang', 'databarang', 'lihatbarang', 'editbarang'],
        "barang.html": ['barang', 'databarang', 'lihatbarang', 'editbarang'],
        "kategori": ['kategori', 'lihatkategori', 'editkategori'],
        "kategori.html": ['kategori', 'lihatkategori', 'editkategori'],
        "report": ['laporan', 'report', 'lihatlaporan'],
        "report.html": ['laporan', 'report', 'lihatlaporan'],
        "users": ['user', 'manajemenuser'],
        "users.html": ['user', 'manajemenuser']
    };

    // ✅ TAMBAHAN UNTUK DEVICES: Mendaftarkan devices ke halaman khusus Admin
    const adminOnlyPages = ['userrole', 'userrole.html', 'metode_pembayaran', 'metode_pembayaran.html', 'store', 'store.html', 'admin_stores', 'admin_stores.html', 'devices', 'devices.html'];

    if (adminOnlyPages.includes(currentPathGuard)) {
        hasAccess = isFullAdmin;
    } else if (pagePermissions[currentPathGuard]) {
        hasAccess = checkMenuAccess(pagePermissions[currentPathGuard]);
    }

    if (!hasAccess) {
        // --- Algoritma Cerdas: Cari halaman valid pertama yang diizinkan user ini ---
        let targetRedirect = "barang"; // Fallback aman jika tidak ada match
        
        const possiblePages = [
            { page: "penjualan", keys: ['penjualan', 'kasir', 'bukakasir'] },
            { page: "barang", keys: ['barang', 'databarang', 'lihatbarang', 'editbarang'] },
            { page: "dashboard", keys: ['dashboard', 'lihatdashboard'] },
            { page: "kategori", keys: ['kategori', 'lihatkategori', 'editkategori'] },
            { page: "report", keys: ['laporan', 'report', 'lihatlaporan'] },
            { page: "users", keys: ['user', 'manajemenuser'] }
        ];

        if (isFullAdmin) {
            targetRedirect = "dashboard";
        } else {
            const allowedPageObj = possiblePages.find(p => checkMenuAccess(p.keys));
            if (allowedPageObj) {
                targetRedirect = allowedPageObj.page;
            }
        }
        // -------------------------------------------------------------------------

        document.body.innerHTML = ''; 
        const blockHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--bg-main, #f1f5f9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 999999; font-family: sans-serif; padding: 20px;">
                <div style="background: var(--surface, #ffffff); padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); text-align: center; max-width: 400px; width: 100%; border: 1px solid var(--border, #e2e8f0); animation: scaleUp 0.3s ease;">
                    <div style="font-size: 3.5rem; margin-bottom: 15px;">🛡️</div>
                    <h2 style="color: #ef4444; margin-bottom: 10px; font-size: 1.3rem; font-weight: bold;">Akses Ditolak!</h2>
                    <p style="color: var(--text-main, #333); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5;">Anda tidak memiliki izin membuka halaman ini. Mengalihkan ke menu yang diizinkan...</p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-muted, #64748b); font-size: 0.85rem; font-weight: 600;">
                        <div class="loader" style="width: 16px; height: 16px; border: 2px solid #ccc; border-top-color: #ef4444; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        Memuat halaman...
                    </div>
                </div>
                <style>
                    @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    @keyframes spin { to { transform: rotate(360deg); } }
                </style>
            </div>
        `;
        document.body.insertAdjacentHTML("afterbegin", blockHTML);

        setTimeout(() => {
            window.location.href = targetRedirect; // Mengarahkan ke halaman valid pertama milik user
        }, 1500);
        
        return;
    }
    // ==============================================================

    // 1. RENDER SIDEBAR
    if (!document.getElementById("app-sidebar")) {
        const adminStoresMenu = userRole.includes('super_admin') 
            ? `<li><a href="admin_stores.html" id="nav-admin-stores">🏢 Kelola Klien SaaS</a></li>` 
            : '';

        let linksHTML = ``;

        if (checkMenuAccess(['dashboard', 'lihatdashboard'])) {
            linksHTML += `<li><a href="dashboard.html" id="nav-dashboard">📊 Dashboard</a></li>`;
        }
        if (checkMenuAccess(['penjualan', 'kasir', 'bukakasir'])) {
            linksHTML += `<li><a href="penjualan.html" id="nav-penjualan">🛒 Kasir / Penjualan</a></li>`;
        }
        if (checkMenuAccess(['barang', 'databarang', 'lihatbarang', 'editbarang'])) {
            linksHTML += `<li><a href="barang.html" id="nav-barang">📦 Data Barang (SKU)</a></li>`;
        }
        if (checkMenuAccess(['kategori', 'lihatkategori', 'editkategori'])) {
            linksHTML += `<li><a href="kategori.html" id="nav-kategori">🏷️ Kategori</a></li>`;
        }
        if (checkMenuAccess(['laporan', 'report', 'lihatlaporan'])) {
            linksHTML += `<li><a href="report.html" id="nav-report">📈 Laporan Penjualan</a></li>`;
        }
        if (checkMenuAccess(['user', 'manajemenuser'])) {
            linksHTML += `<li><a href="users.html" id="nav-users">👥 Manajemen User</a></li>`;
        }

        if (isFullAdmin) {
            // ✅ TAMBAHAN UNTUK DEVICES: Menambahkan link Manajemen Perangkat
            linksHTML += `
                <li><a href="userrole.html" id="nav-userrole">🔐 Role & Hak Akses</a></li>
                <li><a href="metode_pembayaran.html" id="nav-metode">💳 Metode Pembayaran</a></li>
                <li><a href="devices.html" id="nav-devices">📱 Manajemen Perangkat</a></li>
                <li><a href="store.html" id="nav-store">🏢 Pengaturan Toko</a></li>
            `;
        }

        const sidebarHTML = `
        <div id="sidebar-backdrop" onclick="toggleSidebar()"></div>
        <aside id="app-sidebar">
            <div class="brand">
                <span>🚀 KasirPOS SaaS</span>
                <span style="cursor: pointer; font-size: 1rem; padding: 4px;" onclick="toggleSidebar()">✕</span>
            </div>
            <ul class="nav-links">
                ${linksHTML}
                ${adminStoresMenu}
                <li style="margin-top: 30px;"><a href="#" onclick="logoutUser()" style="color: #ef4444;">🚪 Keluar (Logout)</a></li>
            </ul>
        </aside>
        `;
        document.body.insertAdjacentHTML("afterbegin", sidebarHTML);

        let touchStartX = 0;
        let touchEndX = 0;
        window.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, false);
        window.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            const sidebar = document.getElementById('app-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (!sidebar || !backdrop) return;
            if (touchEndX - touchStartX > 70 && touchStartX < 50) {
                sidebar.classList.add('open'); backdrop.classList.add('open');
            }
            if (touchStartX - touchEndX > 70 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open'); backdrop.classList.remove('open');
            }
        }, false);
    }

    // 2. RENDER HEADER
    if (!document.getElementById("app-header")) {
        const oldHeaders = document.querySelectorAll("header:not(#app-header)");
        oldHeaders.forEach(h => h.remove());

        const username = localStorage.getItem('nama_lengkap') || localStorage.getItem('username') || 'Memuat nama...';
        const rawRole = localStorage.getItem('user_role') || localStorage.getItem('role') || 'kasir';
        
        let roleLabel = 'Kasir';
        if (rawRole.toLowerCase().includes('admin')) roleLabel = 'Admin';
        else if (rawRole.toLowerCase().includes('super_admin')) roleLabel = 'Super Admin';
        else if (rawRole.toLowerCase().includes('owner')) roleLabel = 'Owner';

        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const themeButtonText = currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark';

        const currentPath = window.location.pathname.split("/").pop();
        let pageTitle = "POS System";
        if(currentPath.includes("dashboard")) pageTitle = "Dashboard";
        if(currentPath.includes("penjualan")) pageTitle = "Kasir / Penjualan";
        if(currentPath.includes("barang")) pageTitle = "Data Barang";
        if(currentPath.includes("kategori")) pageTitle = "Kategori";
        if(currentPath.includes("report")) pageTitle = "Laporan Penjualan";
        if(currentPath.includes("user")) pageTitle = "Manajemen Pengguna";
        // ✅ TAMBAHAN UNTUK DEVICES: Menambahkan judul dinamis untuk header
        if(currentPath.includes("devices")) pageTitle = "Manajemen Perangkat";

        const headerHTML = `
        <header id="app-header">
            <div style="display: flex; align-items: center; gap: 12px;">
                <button onclick="toggleSidebar()" style="background: none; border: 1px solid var(--border); padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 1rem; color: var(--text-main);" title="Menu">☰</button>
                <h1 style="font-size: 1.1rem; margin: 0; color: var(--text-main); font-weight: bold;">${pageTitle}</h1>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
                <div style="background: var(--bg-main); border: 1px solid var(--border); padding: 4px 10px; border-radius: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.85rem;">
                    <span style="font-size: 0.95rem;">👤</span>
                    <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.15;">
                        <strong class="user-badge-name" style="color: var(--text-main); font-size: 0.8rem;">${username}</strong>
                        <span style="font-size: 0.65rem; color: var(--primary); font-weight: 700; text-transform: uppercase;">${roleLabel}</span>
                    </div>
                </div>

                <button id="theme-toggle-btn" onclick="toggleTheme()" style="background: var(--bg-main); border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: var(--text-main); font-weight: 500;">
                    ${themeButtonText}
                </button>
            </div>
        </header>
        `;
        
        const mainEl = document.querySelector('main');
        if (mainEl) {
            mainEl.insertAdjacentHTML("beforebegin", headerHTML);
        } else {
            document.body.insertAdjacentHTML("afterbegin", headerHTML);
        }
    }
}
// ==========================================
// FUNGSI GLOBAL
// ==========================================
window.toggleSidebar = function() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && backdrop) {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('open');
    }
}

// Fungsi Toggle (Ubah Tema saat tombol diklik)
export function toggleTheme() {
    const themeKey = getUserThemeKey();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(themeKey, newTheme); // Simpan spesifik untuk user ini

    // Diubah dari 'theme-toggle' menjadi 'theme-toggle-btn' agar sesuai dengan header
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
}
window.toggleTheme = toggleTheme;

window.logoutUser = function() {
    localStorage.removeItem("is_logged_in");
    localStorage.removeItem("active_store_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("nama_lengkap"); 
    window.location.href = "login.html";
};

export async function getActiveStoreId() {
    // Cek user yang sedang aktif di localStorage
    const activeUser = JSON.parse(localStorage.getItem('active_user') || '{}');
    
    // Jika user adalah Admin All / Super Admin, jangan ambil store_id acak, kembalikan penanda khusus
    if (activeUser && (activeUser.role === 'admin_all' || activeUser.email?.includes('admin') || activeUser.store_id === 'ALL')) {
        return 'ALL_ADMIN';
    }

    let storeId = localStorage.getItem('active_store_id');
    if (!storeId || storeId === 'null' || storeId === 'undefined' || storeId === 'ALL') {
        try {
            const { data, error } = await supabase.from('stores').select('id').limit(1).maybeSingle();
            if (!error && data) {
                storeId = data.id;
                localStorage.setItem('active_store_id', storeId);
            }
        } catch (e) { console.warn(e); }
    }
    if (!storeId || storeId === 'null' || storeId === 'undefined') {
        storeId = '00000000-0000-0000-0000-000000000001';
        localStorage.setItem('active_store_id', storeId);
    }
    return storeId;
}

export async function generateAutoNota() {
    const storeId = await getActiveStoreId();
    try {
        const { data, error } = await supabase.rpc('generate_no_nota', { p_store_id: storeId });
        if (!error && data) return data;
    } catch (e) { console.warn(e); }
    return 'TRX-' + toDateStringCompressed(new Date()) + '-' + Math.floor(1000 + Math.random() * 9000);
}

function toDateStringCompressed(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

export async function getSelectedStoreFilter() {
    const activeStore = localStorage.getItem('active_store_id');
    if (activeStore === 'ALL') return null; 
    return activeStore || await getActiveStoreId();
}

export async function cleanupExpiredPendingStores() {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: expiredStores, error } = await supabase.from('stores').select('id').eq('is_active', false).lt('created_at', oneHourAgo);
        if (error || !expiredStores || expiredStores.length === 0) return;
        const storeIds = expiredStores.map(s => s.id);
        await supabase.from('users_profile').delete().in('store_id', storeIds);
        await supabase.from('stores').delete().in('id', storeIds);
    } catch (e) { console.warn(e); }
}

export async function checkPermission(actionCode) {
    const userRole = localStorage.getItem("user_role");
    if (userRole === 'super_admin' || userRole === 'admin_client') return true;
    const userEmail = localStorage.getItem("user_email");
    if (!userEmail) return false;
    try {
        const { data, error } = await supabase.from('users_profile').select('role').eq('email', userEmail).single();
        if (error || !data) return false;
        const storeId = localStorage.getItem('active_store_id');
        const { data: roleData } = await supabase.from('roles').select('permissions').eq('store_id', storeId).eq('nama_role', data.role).maybeSingle();
        if (!roleData || !roleData.permissions) return false;
        const permissions = JSON.parse(roleData.permissions);
        return permissions.includes(actionCode);
    } catch (e) { return false; }
}
export function initTheme() {
    const themeKey = getUserThemeKey();
    const savedTheme = localStorage.getItem(themeKey);

    // Default utama adalah 'light' jika belum pernah diubah oleh user
    const currentTheme = savedTheme ? savedTheme : 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update ikon atau status toggle jika ada di halaman
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
}
