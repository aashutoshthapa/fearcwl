
// Initialize Supabase
const SUPABASE_URL = 'https://ovaqlplyxpiffnbjlejf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zgdGKEeftrjD-p_CwE3WmA_xFzLa0rm';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State
let signups = [];
let clans = [];
let selectedPlayerId = null;
let isAdmin = false;

// DOM Elements
const unassignedList = document.getElementById('unassignedList');
const unassignedCount = document.getElementById('unassignedCount');
const clansContainer = document.getElementById('clansContainer');
const addClanBtn = document.getElementById('addClanBtn');
const addClanModal = document.getElementById('addClanModal');
const cancelClanBtn = document.getElementById('cancelClanBtn');
const saveClanBtn = document.getElementById('saveClanBtn');
const newClanName = document.getElementById('newClanName');
const newClanTag = document.getElementById('newClanTag');
const assignModal = document.getElementById('assignModal');
const cancelAssignBtn = document.getElementById('cancelAssignBtn');
const clanSelectContainer = document.getElementById('clanSelectContainer');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Initialization
async function init() {
    await checkAuth();
    await Promise.all([fetchClans(), fetchSignups()]);
    render();
    
    // Realtime subscription
    supabase
        .channel('public:signups')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'signups' }, fetchSignups)
        .subscribe();
        
    supabase
        .channel('public:clans')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clans' }, fetchClans)
        .subscribe();
}

// Authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    isAdmin = !!session;
    toggleAdminUI();
}

function toggleAdminUI() {
    const adminElements = document.querySelectorAll('.admin-only');
    const visitorElements = document.querySelectorAll('.visitor-only');
    
    adminElements.forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
    
    visitorElements.forEach(el => {
        el.style.display = isAdmin ? 'none' : '';
    });
}

async function logout() {
    await supabase.auth.signOut();
    isAdmin = false;
    toggleAdminUI();
    render();
}

// Data Fetching
async function fetchSignups() {
    const { data, error } = await supabase
        .from('signups')
        .select('*')
        .order('town_hall_level', { ascending: false });
        
    if (error) {
        console.error('Error fetching signups:', error);
        return;
    }
    
    signups = data;
    render();
}

async function fetchClans() {
    const { data, error } = await supabase
        .from('clans')
        .select('*')
        .order('created_at', { ascending: true });
        
    if (error) {
        console.error('Error fetching clans:', error);
        return;
    }
    
    clans = data;
    render();
}

// Rendering
function render() {
    renderUnassigned();
    renderClans();
}

function renderUnassigned() {
    const unassigned = signups.filter(p => !p.assigned_clan_id);
    unassignedCount.textContent = unassigned.length;
    
    if (unassigned.length === 0) {
        unassignedList.innerHTML = '<div class="loading">No unassigned players.</div>';
        return;
    }
    
    unassignedList.innerHTML = unassigned.map(player => createPlayerCard(player, false)).join('');
}

function renderClans() {
    if (clans.length === 0) {
        clansContainer.innerHTML = isAdmin ? '<div class="loading">No clans created yet. Click "Add Clan" to start.</div>' : '<div class="loading">No clans created yet.</div>';
        return;
    }
    
    clansContainer.innerHTML = clans.map(clan => {
        const clanPlayers = signups.filter(p => p.assigned_clan_id === clan.id);
        const totalTH = clanPlayers.reduce((sum, p) => sum + p.town_hall_level, 0);
        
        return `
            <div class="clan-card">
                <div class="clan-header">
                    <div>
                        <h3>${clan.name} <span style="color:var(--text-secondary); font-size:0.8em;">${clan.tag || ''}</span></h3>
                        <div class="clan-stats">${clanPlayers.length} Members | Avg TH: ${clanPlayers.length ? (totalTH / clanPlayers.length).toFixed(1) : 0}</div>
                    </div>
                    ${isAdmin ? `<button onclick="deleteClan('${clan.id}')" class="btn danger">Delete Clan</button>` : ''}
                </div>
                <div class="player-list">
                    ${clanPlayers.length > 0 
                        ? clanPlayers.map(p => createPlayerCard(p, true)).join('') 
                        : '<div class="loading">No players assigned.</div>'}
                </div>
                ${isAdmin ? `<div style="margin-top: 15px; text-align: center;">
                    <button onclick="openAssignModalForClan('${clan.id}')" class="btn secondary" style="width:100%">+ Add Players from Unassigned</button>
                </div>` : ''}
            </div>
        `;
    }).join('');
}

function createPlayerCard(player, isAssigned) {
    const thClass = `th-${player.town_hall_level}`;
    const actionButton = isAdmin ? (isAssigned 
        ? `<button onclick="unassignPlayer('${player.id}')" class="btn danger" title="Remove from Clan">×</button>`
        : `<button onclick="openAssignModal('${player.id}')" class="btn primary">Assign</button>`) : '';
        
    return `
        <div class="player-card">
            <div class="player-info">
                <h4>${player.player_name}</h4>
                <div class="player-tag">${player.player_tag}</div>
                <div class="player-meta">
                    <span class="th-badge ${thClass}">TH ${player.town_hall_level}</span>
                    <span class="discord-user">@${player.discord_username}</span>
                </div>
            </div>
            <div class="player-actions">
                ${actionButton}
            </div>
        </div>
    `;
}

// Actions
async function createNewClan() {
    const name = newClanName.value.trim();
    const tag = newClanTag.value.trim();
    
    if (!name) return alert('Clan name is required');
    
    const { error } = await supabase
        .from('clans')
        .insert([{ name, tag }]);
        
    if (error) {
        alert('Error creating clan: ' + error.message);
    } else {
        closeAddClanModal();
        fetchClans();
    }
}

async function deleteClan(clanId) {
    if (!confirm('Are you sure? All players in this clan will be unassigned.')) return;
    
    // First unassign all players
    await supabase
        .from('signups')
        .update({ assigned_clan_id: null })
        .eq('assigned_clan_id', clanId);
        
    // Then delete clan
    const { error } = await supabase
        .from('clans')
        .delete()
        .eq('id', clanId);
        
    if (error) alert('Error deleting clan: ' + error.message);
    else fetchClans();
}

async function assignPlayerToClan(playerId, clanId) {
    const { error } = await supabase
        .from('signups')
        .update({ assigned_clan_id: clanId })
        .eq('id', playerId);
        
    if (error) alert('Error assigning player: ' + error.message);
    else {
        closeAssignModal();
        fetchSignups();
    }
}

async function unassignPlayer(playerId) {
    const { error } = await supabase
        .from('signups')
        .update({ assigned_clan_id: null })
        .eq('id', playerId);
        
    if (error) alert('Error unassigning player: ' + error.message);
    else fetchSignups();
}

// Modal Logic
function openAddClanModal() {
    addClanModal.classList.remove('hidden');
    newClanName.value = '';
    newClanTag.value = '';
    newClanName.focus();
}

function closeAddClanModal() {
    addClanModal.classList.add('hidden');
}

function openAssignModal(playerId) {
    selectedPlayerId = playerId;
    const player = signups.find(p => p.id === playerId);
    document.getElementById('assignPlayerName').textContent = `Assign ${player.player_name} to:`;
    
    if (clans.length === 0) {
        clanSelectContainer.innerHTML = '<div class="loading">No clans available. Create one first.</div>';
    } else {
        clanSelectContainer.innerHTML = clans.map(clan => `
            <div class="clan-option" onclick="assignPlayerToClan('${playerId}', '${clan.id}')">
                <strong>${clan.name}</strong> (${clan.tag || ''})
            </div>
        `).join('');
    }
    
    assignModal.classList.remove('hidden');
}

// Bulk Assign Logic
function openAssignModalForClan(clanId) {
    const clan = clans.find(c => c.id === clanId);
    const unassigned = signups.filter(p => !p.assigned_clan_id);
    
    const modalTitle = document.getElementById('assignPlayerName');
    modalTitle.textContent = `Add players to ${clan.name}:`;
    
    const container = document.getElementById('clanSelectContainer');
    const modalActions = document.querySelector('#assignModal .modal-actions');
    
    // Remove any existing confirm button
    const existingBtn = document.getElementById('confirmAssignBtn');
    if (existingBtn) existingBtn.remove();

    if (unassigned.length === 0) {
        container.innerHTML = '<div class="loading">No unassigned players available.</div>';
    } else {
        // Render checkboxes
        container.innerHTML = unassigned.map(player => `
            <label class="clan-option checkbox-option">
                <input type="checkbox" name="playerSelect" value="${player.id}">
                <span>
                    <strong>${player.player_name}</strong> 
                    <span style="font-size:0.85em; color:var(--text-secondary)">(@${player.discord_username})</span>
                    <span class="th-badge th-${player.town_hall_level}" style="margin-left:5px; font-size:0.7em;">TH${player.town_hall_level}</span>
                </span>
            </label>
        `).join('');
        
        // Add Confirm Button
        const confirmBtn = document.createElement('button');
        confirmBtn.id = 'confirmAssignBtn';
        confirmBtn.className = 'btn primary';
        confirmBtn.textContent = 'Assign Selected';
        confirmBtn.onclick = () => assignSelectedPlayers(clanId);
        modalActions.appendChild(confirmBtn);
    }
    
    assignModal.classList.remove('hidden');
}

async function assignSelectedPlayers(clanId) {
    const checkboxes = document.querySelectorAll('input[name="playerSelect"]:checked');
    const playerIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (playerIds.length === 0) {
        alert('Please select at least one player.');
        return;
    }
    
    const { error } = await supabase
        .from('signups')
        .update({ assigned_clan_id: clanId })
        .in('id', playerIds);
        
    if (error) {
        alert('Error assigning players: ' + error.message);
    } else {
        closeAssignModal();
        fetchSignups();
    }
}

function closeAssignModal() {
    assignModal.classList.add('hidden');
    selectedPlayerId = null;
    // Clean up confirm button if it exists
    const existingBtn = document.getElementById('confirmAssignBtn');
    if (existingBtn) existingBtn.remove();
}

// Event Listeners
addClanBtn.addEventListener('click', openAddClanModal);
cancelClanBtn.addEventListener('click', closeAddClanModal);
saveClanBtn.addEventListener('click', createNewClan);
cancelAssignBtn.addEventListener('click', closeAssignModal);
loginBtn.addEventListener('click', () => window.location.href = 'login.html');
logoutBtn.addEventListener('click', logout);

// Close modals on outside click
window.onclick = function(event) {
    if (event.target == addClanModal) closeAddClanModal();
    if (event.target == assignModal) closeAssignModal();
}

// Expose functions to window for HTML onclick attributes
window.deleteClan = deleteClan;
window.unassignPlayer = unassignPlayer;
window.openAssignModal = openAssignModal;
window.openAssignModalForClan = openAssignModalForClan;
window.assignPlayerToClan = assignPlayerToClan;

// Start
init();
