// Complete Online Voting System Logic Controller

// Default Pre-populated Candidate Configuration
const DEFAULT_CANDIDATES = [
    {
        id: 1,
        name: "John Doe",
        dept: "AI & DS",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500",
        desc: "Advocating for fully transparent decentralized ledgers, expanded compute resources, and enhanced industry hackathon sponsorships.",
        votes: 14
    },
    {
        id: 2,
        name: "Jane Smith",
        dept: "CSE",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500",
        desc: "Focusing on optimized campus Wi-Fi infrastructure, peer-to-peer programming workshops, and direct technical mentorship programs.",
        votes: 21
    },
    {
        id: 3,
        name: "Mark Lee",
        dept: "ECE",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500",
        desc: "Promoting hardware lab modernizations, IoT research task forces, and cross-departmental product incubation grants.",
        votes: 9
    }
];

// State Initialization
function initializeSystemState() {
    // Check if candidates exist in localStorage
    if (!localStorage.getItem('rec_candidates')) {
        localStorage.setItem('rec_candidates', JSON.stringify(DEFAULT_CANDIDATES));
    }
    // Check if voted nodes list exists
    if (!localStorage.getItem('rec_voted_nodes')) {
        localStorage.setItem('rec_voted_nodes', JSON.stringify([]));
    }
}

// Global Variables
let isAdminMode = false;
let pendingVoteCandidateId = null;
let currentGeneratedOtp = null;
let otpTimerInterval = null;
let otpTimeRemaining = 119;

// Helper Functions to read/write state
function getCandidates() {
    return JSON.parse(localStorage.getItem('rec_candidates')) || [];
}

function saveCandidates(candidates) {
    localStorage.setItem('rec_candidates', JSON.stringify(candidates));
}

function getVotedNodes() {
    return JSON.parse(localStorage.getItem('rec_voted_nodes')) || [];
}

function saveVotedNodes(nodes) {
    localStorage.setItem('rec_voted_nodes', JSON.stringify(nodes));
}

// UI Notification Toast
function showToast(message) {
    const toast = document.getElementById('toast-msg');
    const toastText = document.getElementById('toast-text');
    toastText.textContent = message;
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Navigation & View Switching Logic
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-sidebar .nav-item');
    const views = document.querySelectorAll('.content-area .view-panel');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Check if link anchor, don't prevent default
            if (item.tagName.toLowerCase() === 'a') return;
            
            const targetId = item.getAttribute('data-target');
            
            // Check authorization for Admin Profile tab
            if (targetId === 'view-admin' && !isAdminMode) {
                document.getElementById('modal-admin-auth').classList.add('active');
                return;
            }

            // Update Active Nav Style
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Switch Target View
            views.forEach(v => v.classList.remove('active'));
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.add('active');
            }

            // Refresh specialized renderers
            updateFullInterface();
        });
    });
}

// Role Toggling Logic
function setupRoleManagement() {
    const btnToggleRole = document.getElementById('btn-toggle-role');
    const roleBadge = document.getElementById('role-status-badge');
    const roleText = document.getElementById('role-text');
    const modalAuth = document.getElementById('modal-admin-auth');
    const btnCloseModal = document.getElementById('modal-close-btn');
    const btnConfirmAuth = document.getElementById('btn-confirm-auth');
    const inputPasskey = document.getElementById('admin-passkey');
    const authError = document.getElementById('auth-error');

    btnToggleRole.addEventListener('click', () => {
        if (isAdminMode) {
            // Switch back to Voter Mode
            isAdminMode = false;
            roleBadge.className = 'role-badge voter';
            roleText.textContent = 'Voter Mode';
            btnToggleRole.textContent = 'Switch to Admin';
            showToast("Switched to Standard Voter access");
            
            // If viewing admin tab, revert to ballot tab safely
            const activeView = document.querySelector('.view-panel.active');
            if (activeView && activeView.id === 'view-admin') {
                document.getElementById('nav-ballot').click();
            }
        } else {
            // Prompt Admin Passkey Modal
            inputPasskey.value = '';
            authError.style.display = 'none';
            modalAuth.classList.add('active');
        }
    });

    btnCloseModal.addEventListener('click', () => {
        modalAuth.classList.remove('active');
    });

    // Handle authentication authorization confirmation
    const authorizeAction = () => {
        if (inputPasskey.value === 'admin' || inputPasskey.value === 'admin123') {
            isAdminMode = true;
            modalAuth.classList.remove('active');
            roleBadge.className = 'role-badge admin';
            roleText.textContent = 'Admin Mode';
            btnToggleRole.textContent = 'Exit Admin Mode';
            showToast("Authorized as System Administrator");
            
            // Switch automatically to Admin tab view
            document.getElementById('nav-admin').classList.add('active');
            document.getElementById('nav-ballot').classList.remove('active');
            document.getElementById('nav-results').classList.remove('active');
            
            document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
            document.getElementById('view-admin').classList.add('active');
            
            updateFullInterface();
        } else {
            authError.style.display = 'block';
            inputPasskey.focus();
        }
    };

    btnConfirmAuth.addEventListener('click', authorizeAction);
    inputPasskey.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authorizeAction();
    });
}

// Check real-time voting status for node
function checkCurrentVoterStatus() {
    const voterIdInput = document.getElementById('voter-id-input');
    const statusTag = document.getElementById('voter-vote-status');
    const votedNodes = getVotedNodes();
    
    if (!voterIdInput) return;
    
    const currentId = voterIdInput.value.trim().toUpperCase();
    
    if (votedNodes.includes(currentId)) {
        statusTag.textContent = "Vote Recorded";
        statusTag.style.background = "rgba(11, 163, 96, 0.15)";
        statusTag.style.color = "var(--accent-green)";
        statusTag.style.borderColor = "rgba(11, 163, 96, 0.3)";
    } else {
        statusTag.textContent = "Ready to Vote";
        statusTag.style.background = "rgba(0, 242, 254, 0.15)";
        statusTag.style.color = "var(--accent-glow)";
        statusTag.style.borderColor = "rgba(0, 242, 254, 0.3)";
    }
}

// 1. Render Dynamic Voting Ballot
function renderBallotView() {
    const grid = document.getElementById('candidates-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const candidates = getCandidates();
    const votedNodes = getVotedNodes();
    const voterIdInput = document.getElementById('voter-id-input');
    const currentVoterId = voterIdInput ? voterIdInput.value.trim().toUpperCase() : '';
    const hasVoted = votedNodes.includes(currentVoterId);

    if (candidates.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
            No active candidates found. Admin must register candidates via the Admin Configuration Center.
        </div>`;
        return;
    }

    candidates.forEach(cand => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        
        card.innerHTML = `
            <div class="candidate-avatar-wrapper">
                <img src="${cand.avatar}" alt="${cand.name}" class="candidate-avatar" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500'">
                <span class="candidate-dept">${cand.dept}</span>
            </div>
            <div class="candidate-info">
                <div class="candidate-name">${cand.name}</div>
                <div class="candidate-role">Department Representative</div>
                <div class="candidate-desc">${cand.desc}</div>
                <button class="btn-vote" data-id="${cand.id}" ${hasVoted ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    ${hasVoted ? '✓ Vote Registered' : 'Cast Vote'}
                </button>
            </div>
        `;

        grid.appendChild(card);
    });

    // Attach vote trigger handlers
    document.querySelectorAll('.btn-vote').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.disabled) return;
            
            const candId = parseInt(btn.getAttribute('data-id'));
            castVoteForCandidate(candId);
        });
    });
}

// Trigger casting a vote securely - Launches OTP Verification Flow
function castVoteForCandidate(candidateId) {
    const voterIdInput = document.getElementById('voter-id-input');
    const currentVoterId = voterIdInput.value.trim().toUpperCase();

    if (!currentVoterId) {
        showToast("Please enter a valid Voter ID node hash!");
        voterIdInput.focus();
        return;
    }

    const votedNodes = getVotedNodes();
    if (votedNodes.includes(currentVoterId)) {
        showToast("Access Denied: This Voter ID has already cast a ballot!");
        return;
    }

    // Save candidate target for completion after OTP verification
    pendingVoteCandidateId = candidateId;
    
    // Set Target ID text in modal
    const targetTextEl = document.getElementById('otp-target-voter-id');
    if (targetTextEl) targetTextEl.textContent = currentVoterId;
    
    // Launch dynamic OTP flow
    triggerNewOtpGeneration();
    
    // Open Modal cleanly
    const modalOtp = document.getElementById('modal-otp-auth');
    if (modalOtp) modalOtp.classList.add('active');
}

// Generate new OTP and reset interface state
function triggerNewOtpGeneration() {
    // Generate secure pseudo-random 4-digit numeric string
    currentGeneratedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Populate the simulated alert message box
    const displayedMockOtp = document.getElementById('displayed-mock-otp');
    if (displayedMockOtp) displayedMockOtp.textContent = currentGeneratedOtp;
    
    // Clear Input Boxes & Error messages
    for (let i = 1; i <= 4; i++) {
        const charInput = document.getElementById(`otp-char-${i}`);
        if (charInput) charInput.value = '';
    }
    const errorMsg = document.getElementById('otp-error-msg');
    if (errorMsg) errorMsg.style.display = 'none';
    
    // Reset Timer
    startOtpCountdownTimer();
    
    // Focus first input automatically
    setTimeout(() => {
        const firstInput = document.getElementById('otp-char-1');
        if (firstInput) firstInput.focus();
    }, 100);
}

// Timer management logic
function startOtpCountdownTimer() {
    clearInterval(otpTimerInterval);
    otpTimeRemaining = 119;
    updateTimerText();
    
    otpTimerInterval = setInterval(() => {
        otpTimeRemaining--;
        if (otpTimeRemaining <= 0) {
            clearInterval(otpTimerInterval);
            otpTimeRemaining = 0;
            // Set expired indicator visually
            currentGeneratedOtp = null; // invalidate
            const countdownEl = document.getElementById('otp-countdown-text');
            if (countdownEl) countdownEl.textContent = "EXPIRED";
            const displayedMockOtp = document.getElementById('displayed-mock-otp');
            if (displayedMockOtp) displayedMockOtp.textContent = "EXPIRED";
        } else {
            updateTimerText();
        }
    }, 1000);
}

function updateTimerText() {
    const countdownEl = document.getElementById('otp-countdown-text');
    if (!countdownEl) return;
    const mins = Math.floor(otpTimeRemaining / 60).toString().padStart(2, '0');
    const secs = (otpTimeRemaining % 60).toString().padStart(2, '0');
    countdownEl.textContent = `${mins}:${secs}`;
}

// Finalize vote record upon verification success
function commitVerifiedVote() {
    if (!pendingVoteCandidateId) return;
    
    const voterIdInput = document.getElementById('voter-id-input');
    const currentVoterId = voterIdInput.value.trim().toUpperCase();
    const votedNodes = getVotedNodes();
    
    if (votedNodes.includes(currentVoterId)) return; // double check safeguard

    // Update Ledger Tallies
    const candidates = getCandidates();
    const updatedCandidates = candidates.map(cand => {
        if (cand.id === pendingVoteCandidateId) {
            return { ...cand, votes: cand.votes + 1 };
        }
        return cand;
    });

    // Save changes
    saveCandidates(updatedCandidates);
    votedNodes.push(currentVoterId);
    saveVotedNodes(votedNodes);

    // Provide sensory confirmation feedback
    const votedCand = updatedCandidates.find(c => c.id === pendingVoteCandidateId);
    showToast(`Successfully verified & recorded vote for ${votedCand.name}!`);

    // Clean up modal state
    clearInterval(otpTimerInterval);
    const modalOtp = document.getElementById('modal-otp-auth');
    if (modalOtp) modalOtp.classList.remove('active');
    pendingVoteCandidateId = null;

    // Complete DOM sync
    updateFullInterface();
}

// 2. Render Live Statistical Results View
function renderResultsView() {
    const barsWrapper = document.getElementById('results-bars-wrapper');
    const statTotalVotes = document.getElementById('stat-total-votes');
    const statTotalCand = document.getElementById('stat-total-candidates');
    if (!barsWrapper || !statTotalVotes || !statTotalCand) return;

    barsWrapper.innerHTML = '';
    const candidates = getCandidates();
    
    // Compute total sum
    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
    statTotalVotes.textContent = totalVotes;
    statTotalCand.textContent = candidates.length;

    if (candidates.length === 0) {
        barsWrapper.innerHTML = `<div style="text-align: center; color: var(--text-muted);">No computed tracking data available.</div>`;
        return;
    }

    // Determine current highest score leader
    let maxVotes = -1;
    candidates.forEach(c => {
        if (c.votes > maxVotes) maxVotes = c.votes;
    });

    // Sort descending for intuitive visual hierarchy
    const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);

    sortedCandidates.forEach(cand => {
        const percentage = totalVotes > 0 ? ((cand.votes / totalVotes) * 100).toFixed(1) : 0;
        const isLeader = cand.votes === maxVotes && maxVotes > 0;

        const item = document.createElement('div');
        item.className = 'result-item';
        
        item.innerHTML = `
            <div class="result-info">
                <div class="result-name-group">
                    <img src="${cand.avatar}" class="result-avatar" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500'">
                    <span class="result-name">${cand.name}</span>
                    <span style="color: var(--text-muted); font-size: 12px;">(${cand.dept})</span>
                    ${isLeader ? '<span class="result-badge-leader">Leading ★</span>' : ''}
                </div>
                <div class="result-numbers">
                    <span class="result-votes-count">${cand.votes} votes</span>
                    <span>${percentage}%</span>
                </div>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${percentage}%;"></div>
            </div>
        `;

        barsWrapper.appendChild(item);
    });
}

// 3. Render Admin Panel Management Interface
function setupAdminInteractions() {
    const avatarPresets = document.querySelectorAll('.preset-avatar-option');
    const hiddenAvatarInput = document.getElementById('selected-avatar-url');
    const formAddCand = document.getElementById('form-add-candidate');
    const btnResetVotes = document.getElementById('btn-reset-votes');
    const btnFactoryReset = document.getElementById('btn-factory-reset');

    // Handle preset selection changes
    avatarPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            avatarPresets.forEach(p => p.classList.remove('selected'));
            preset.classList.add('selected');
            hiddenAvatarInput.value = preset.getAttribute('data-url');
        });
    });

    // Handle registering a new candidate dynamically
    if (formAddCand) {
        formAddCand.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('candidate-name');
            const deptSelect = document.getElementById('candidate-dept');
            const descArea = document.getElementById('candidate-desc');
            
            const newCandidate = {
                id: Date.now(),
                name: nameInput.value.trim(),
                dept: deptSelect.value,
                avatar: hiddenAvatarInput.value,
                desc: descArea.value.trim(),
                votes: 0
            };

            const candidates = getCandidates();
            candidates.push(newCandidate);
            saveCandidates(candidates);

            showToast(`Candidate "${newCandidate.name}" successfully added to Live Ballot!`);

            // Clear input fields cleanly
            nameInput.value = '';
            descArea.value = '';

            updateFullInterface();
        });
    }

    // Override 1: Clear all individual vote tallies
    if (btnResetVotes) {
        btnResetVotes.addEventListener('click', () => {
            if (confirm("Are you sure you want to erase all current vote counts? This clears poll records but retains candidate profiles.")) {
                const candidates = getCandidates().map(c => ({ ...c, votes: 0 }));
                saveCandidates(candidates);
                saveVotedNodes([]); // flush voter records
                
                showToast("All vote registers reset to zero successfully");
                updateFullInterface();
            }
        });
    }

    // Override 2: Full factory state revert
    if (btnFactoryReset) {
        btnFactoryReset.addEventListener('click', () => {
            if (confirm("DANGER: Factory reset will restore original Week 1 default candidates and clear custom additions. Continue?")) {
                localStorage.setItem('rec_candidates', JSON.stringify(DEFAULT_CANDIDATES));
                saveVotedNodes([]);
                
                showToast("Database restored to factory base configuration");
                updateFullInterface();
            }
        });
    }
}

// Render dynamic roster items in Admin UI
function renderAdminRosterView() {
    const listContainer = document.getElementById('admin-candidates-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const candidates = getCandidates();

    if (candidates.length === 0) {
        listContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">No active candidates. Add new entries using the registration form.</div>`;
        return;
    }

    candidates.forEach(cand => {
        const row = document.createElement('div');
        row.className = 'admin-candidate-row';
        
        row.innerHTML = `
            <div class="admin-candidate-details">
                <img src="${cand.avatar}" class="admin-row-avatar" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500'">
                <div>
                    <div class="admin-row-name">${cand.name}</div>
                    <div class="admin-row-dept">${cand.dept} • <span style="color: var(--accent-glow); font-weight: 600;">${cand.votes} votes</span></div>
                </div>
            </div>
            <button class="btn-delete" data-id="${cand.id}">Remove</button>
        `;

        listContainer.appendChild(row);
    });

    // Attach deletion trigger logic
    listContainer.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const idToRemove = parseInt(btn.getAttribute('data-id'));
            const candToRemove = candidates.find(c => c.id === idToRemove);
            
            if (confirm(`Remove ${candToRemove.name} from the active election list?`)) {
                const updatedCandidates = candidates.filter(c => c.id !== idToRemove);
                saveCandidates(updatedCandidates);
                showToast(`Removed candidate ${candToRemove.name}`);
                updateFullInterface();
            }
        });
    });
}

// Master synchronize controller updating reactive views
function updateFullInterface() {
    checkCurrentVoterStatus();
    renderBallotView();
    renderResultsView();
    renderAdminRosterView();
}

// Setup event listeners for the OTP verification flow
function setupOtpInteractions() {
    const modalOtp = document.getElementById('modal-otp-auth');
    const btnCloseOtp = document.getElementById('modal-otp-close-btn');
    const btnResendOtp = document.getElementById('btn-resend-otp');
    const btnVerifyOtp = document.getElementById('btn-verify-otp');
    const errorMsg = document.getElementById('otp-error-msg');
    
    if (btnCloseOtp) {
        btnCloseOtp.addEventListener('click', () => {
            clearInterval(otpTimerInterval);
            if (modalOtp) modalOtp.classList.remove('active');
            pendingVoteCandidateId = null;
        });
    }

    if (btnResendOtp) {
        btnResendOtp.addEventListener('click', () => {
            triggerNewOtpGeneration();
            showToast("A fresh OTP has been securely dispatched.");
        });
    }

    // Auto-advance & Backspace listeners for input squares
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`otp-char-${i}`);
        if (!input) continue;

        input.addEventListener('input', (e) => {
            // Ensure numeric input only for strict adherence
            input.value = input.value.replace(/[^0-9]/g, '');
            
            if (input.value && i < 4) {
                const nextInput = document.getElementById(`otp-char-${i+1}`);
                if (nextInput) nextInput.focus();
            }
            if (errorMsg) errorMsg.style.display = 'none';
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && i > 1) {
                const prevInput = document.getElementById(`otp-char-${i-1}`);
                if (prevInput) {
                    prevInput.focus();
                    prevInput.value = '';
                }
            } else if (e.key === 'Enter') {
                if (btnVerifyOtp) btnVerifyOtp.click();
            }
        });
    }

    // Verification evaluation logic
    if (btnVerifyOtp) {
        btnVerifyOtp.addEventListener('click', () => {
            if (!currentGeneratedOtp) {
                if (errorMsg) {
                    errorMsg.textContent = "Code expired. Please request a new code.";
                    errorMsg.style.display = 'block';
                }
                return;
            }

            let enteredOtp = '';
            for (let i = 1; i <= 4; i++) {
                const el = document.getElementById(`otp-char-${i}`);
                if (el) enteredOtp += el.value;
            }

            if (enteredOtp === currentGeneratedOtp) {
                commitVerifiedVote();
            } else {
                if (errorMsg) {
                    errorMsg.textContent = "Incorrect code entered. Please verify and try again.";
                    errorMsg.style.display = 'block';
                }
                // Shake or clear inputs
                for (let i = 1; i <= 4; i++) {
                    const el = document.getElementById(`otp-char-${i}`);
                    if (el) el.value = '';
                }
                const firstEl = document.getElementById('otp-char-1');
                if (firstEl) firstEl.focus();
            }
        });
    }
}

// Event hooks setup on complete content readiness
document.addEventListener('DOMContentLoaded', () => {
    initializeSystemState();
    setupNavigation();
    setupRoleManagement();
    setupAdminInteractions();
    setupOtpInteractions();
    
    // Allow custom testing node adjustments to recalculate dynamically
    const voterIdInput = document.getElementById('voter-id-input');
    if (voterIdInput) {
        voterIdInput.addEventListener('input', () => {
            checkCurrentVoterStatus();
            renderBallotView(); // update button states dynamically based on new input
        });
    }

    // Launch initial paint
    updateFullInterface();
});
