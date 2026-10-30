/* ==========================================================================
   YASHRAJ NIMBALKAR — ELEVATED PORTFOLIO APPLICATION LOGIC
   Three.js 3D Background Engine, Web Audio, Python IDE & 3D Tilt Cards
   ========================================================================== */

(function () {
    'use strict';

    // State
    const state = {
        audioEnabled: false,
        activeTheme: localStorage.getItem('theme') || 'dark',
        soundCtx: null,
        currentCodeFile: 'main'
    };

    // ==========================================================================
    // 1. TACTILE WEB AUDIO SYNTHESIZER
    // ==========================================================================
    const AudioEngine = {
        init() {
            if (!state.soundCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) state.soundCtx = new AudioContext();
            }
            if (state.soundCtx && state.soundCtx.state === 'suspended') {
                state.soundCtx.resume();
            }
        },

        playClick(freq = 880) {
            if (!state.audioEnabled || !state.soundCtx) return;
            try {
                const ctx = state.soundCtx;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.035);

                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + 0.035);
            } catch (e) {}
        },

        playChime() {
            if (!state.audioEnabled || !state.soundCtx) return;
            try {
                const ctx = state.soundCtx;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(174, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(348, ctx.currentTime + 0.3);

                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + 0.5);
            } catch (e) {}
        }
    };

    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            AudioEngine.init();
            state.audioEnabled = !state.audioEnabled;
            soundToggle.classList.toggle('active', state.audioEnabled);
            if (state.audioEnabled) {
                AudioEngine.playChime();
            }
        });
    }

    // ==========================================================================
    // 2. THREE.JS IMMERSIVE 3D BACKGROUND ENGINE
    // ==========================================================================
    let bgScene, bgCamera, bgRenderer;
    let particleSystem, particlePositions, particleVelocities;
    let lineMesh, lineGeometry;
    let floatingIcosahedron, floatingTorus;
    const particleCount = 280;
    const maxDistance = 4.2;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scrollY = 0;

    function init3DBackground() {
        const canvas = document.getElementById('bg3dCanvas');
        if (!canvas || typeof THREE === 'undefined') return;

        bgScene = new THREE.Scene();

        bgCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
        bgCamera.position.z = 24;

        bgRenderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        bgRenderer.setSize(window.innerWidth, window.innerHeight);
        bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create 3D Floating Particles
        const particleGeo = new THREE.BufferGeometry();
        particlePositions = new Float32Array(particleCount * 3);
        particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * 44;
            const y = (Math.random() - 0.5) * 32;
            const z = (Math.random() - 0.5) * 20;

            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;

            particleVelocities.push({
                vx: (Math.random() - 0.5) * 0.016,
                vy: (Math.random() - 0.5) * 0.016,
                vz: (Math.random() - 0.5) * 0.012
            });
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleColor = state.activeTheme === 'dark' ? 0x4d8dff : 0x0044ff;
        const particleMat = new THREE.PointsMaterial({
            color: particleColor,
            size: 0.18,
            transparent: true,
            opacity: state.activeTheme === 'dark' ? 0.8 : 0.6
        });

        particleSystem = new THREE.Points(particleGeo, particleMat);
        bgScene.add(particleSystem);

        // Dynamic Connecting Lines
        lineGeometry = new THREE.BufferGeometry();
        const maxLines = particleCount * 6;
        const linePositions = new Float32Array(maxLines * 6);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        const lineColor = state.activeTheme === 'dark' ? 0x4d8dff : 0x0044ff;
        const lineMat = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: state.activeTheme === 'dark' ? 0.18 : 0.12
        }));
        bgScene.add(lineMat);

        // Floating 3D Geometric Accents
        const icoGeo = new THREE.IcosahedronGeometry(2.2, 1);
        const icoMat = new THREE.MeshBasicMaterial({
            color: particleColor,
            wireframe: true,
            transparent: true,
            opacity: state.activeTheme === 'dark' ? 0.22 : 0.14
        });
        floatingIcosahedron = new THREE.Mesh(icoGeo, icoMat);
        floatingIcosahedron.position.set(16, 6, -4);
        bgScene.add(floatingIcosahedron);

        const torusGeo = new THREE.TorusGeometry(3, 0.4, 8, 32);
        const torusMat = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            wireframe: true,
            transparent: true,
            opacity: state.activeTheme === 'dark' ? 0.16 : 0.1
        });
        floatingTorus = new THREE.Mesh(torusGeo, torusMat);
        floatingTorus.position.set(-18, -10, -6);
        floatingTorus.rotation.x = Math.PI / 3;
        bgScene.add(floatingTorus);

        // Window resize
        window.addEventListener('resize', () => {
            bgCamera.aspect = window.innerWidth / window.innerHeight;
            bgCamera.updateProjectionMatrix();
            bgRenderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Mouse tracking for parallax & particle gravity
        window.addEventListener('mousemove', (e) => {
            mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('scroll', () => {
            scrollY = window.scrollY;
        }, { passive: true });

        animate3D();
    }

    function animate3D() {
        requestAnimationFrame(animate3D);

        // Smooth mouse dampening
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Camera gentle drift & scroll parallax
        bgCamera.position.x = mouse.x * 2.5;
        bgCamera.position.y = mouse.y * 2.5 - (scrollY * 0.008);
        bgCamera.lookAt(0, -scrollY * 0.008, 0);

        // Rotate floating geometric objects
        if (floatingIcosahedron) {
            floatingIcosahedron.rotation.x += 0.004;
            floatingIcosahedron.rotation.y += 0.006;
            floatingIcosahedron.position.y = 6 + Math.sin(Date.now() * 0.001) * 0.8;
        }

        if (floatingTorus) {
            floatingTorus.rotation.y += 0.003;
            floatingTorus.rotation.z += 0.005;
            floatingTorus.position.y = -10 + Math.cos(Date.now() * 0.0008) * 1.2;
        }

        // Particle updates & connections
        if (particlePositions && particleVelocities) {
            let lineIdx = 0;
            const linePosAttr = lineGeometry.getAttribute('position');
            const linePositionsArray = linePosAttr.array;

            for (let i = 0; i < particleCount; i++) {
                // Velocity step
                particlePositions[i * 3] += particleVelocities[i].vx;
                particlePositions[i * 3 + 1] += particleVelocities[i].vy;
                particlePositions[i * 3 + 2] += particleVelocities[i].vz;

                // Boundary bounce
                if (Math.abs(particlePositions[i * 3]) > 22) particleVelocities[i].vx *= -1;
                if (Math.abs(particlePositions[i * 3 + 1]) > 16) particleVelocities[i].vy *= -1;
                if (Math.abs(particlePositions[i * 3 + 2]) > 10) particleVelocities[i].vz *= -1;

                // Mouse gravity attraction (slight pull toward cursor)
                const dx = (mouse.x * 12) - particlePositions[i * 3];
                const dy = (mouse.y * 8) - particlePositions[i * 3 + 1];
                const distMouse = Math.sqrt(dx * dx + dy * dy);
                if (distMouse < 8) {
                    particlePositions[i * 3] += dx * 0.002;
                    particlePositions[i * 3 + 1] += dy * 0.002;
                }

                // Connect to nearest neighbors
                for (let j = i + 1; j < particleCount; j++) {
                    const p1x = particlePositions[i * 3];
                    const p1y = particlePositions[i * 3 + 1];
                    const p1z = particlePositions[i * 3 + 2];

                    const p2x = particlePositions[j * 3];
                    const p2y = particlePositions[j * 3 + 1];
                    const p2z = particlePositions[j * 3 + 2];

                    const dist = Math.hypot(p1x - p2x, p1y - p2y, p1z - p2z);

                    if (dist < maxDistance && lineIdx < linePositionsArray.length - 6) {
                        linePositionsArray[lineIdx++] = p1x;
                        linePositionsArray[lineIdx++] = p1y;
                        linePositionsArray[lineIdx++] = p1z;
                        linePositionsArray[lineIdx++] = p2x;
                        linePositionsArray[lineIdx++] = p2y;
                        linePositionsArray[lineIdx++] = p2z;
                    }
                }
            }

            // Zero out remaining unused line coordinates
            for (let k = lineIdx; k < linePositionsArray.length; k++) {
                linePositionsArray[k] = 0;
            }

            particleSystem.geometry.attributes.position.needsUpdate = true;
            linePosAttr.needsUpdate = true;
        }

        bgRenderer.render(bgScene, bgCamera);
    }

    function update3DTheme(theme) {
        if (!particleSystem || !floatingIcosahedron || !floatingTorus) return;
        const color = theme === 'dark' ? 0x4d8dff : 0x0044ff;
        particleSystem.material.color.setHex(color);
        particleSystem.material.opacity = theme === 'dark' ? 0.8 : 0.6;
        floatingIcosahedron.material.color.setHex(color);
        floatingIcosahedron.material.opacity = theme === 'dark' ? 0.22 : 0.14;
    }

    // ==========================================================================
    // 3. THEME TOGGLE (Dark / Light)
    // ==========================================================================
    (function () {
        const root = document.documentElement;
        const toggleBtn = document.getElementById('themeToggle');
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (stored === 'dark' || (!stored && prefersDark)) {
            root.setAttribute('data-theme', 'dark');
            state.activeTheme = 'dark';
        } else {
            root.removeAttribute('data-theme');
            state.activeTheme = 'light';
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                AudioEngine.playClick(950);
                const isDark = root.getAttribute('data-theme') === 'dark';
                if (isDark) {
                    root.removeAttribute('data-theme');
                    localStorage.setItem('theme', 'light');
                    state.activeTheme = 'light';
                } else {
                    root.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                    state.activeTheme = 'dark';
                }
                update3DTheme(state.activeTheme);
            });
        }
    })();

    // ==========================================================================
    // 4. ANIMATED HERO TEXT (Letter-by-Letter Pop)
    // ==========================================================================
    function animateText() {
        const textContainer = document.getElementById('animatedText');
        const text = 'hi,';
        if (!textContainer) return;

        textContainer.innerHTML = '';
        text.split('').forEach((letter, index) => {
            const span = document.createElement('span');
            span.className = 'animated-letter';
            span.textContent = letter === ' ' ? '\u00A0' : letter;
            span.style.animationDelay = `${index * 0.15}s`;
            textContainer.appendChild(span);
        });

        const yashrajContainer = document.getElementById('yashrajText');
        if (yashrajContainer) {
            const underline = document.createElement('div');
            underline.className = 'animated-underline';
            underline.style.animationDelay = `${text.length * 0.15 + 0.35}s`;
            yashrajContainer.appendChild(underline);
        }
    }

    window.addEventListener('load', animateText);

    // ==========================================================================
    // 5. INTERACTIVE CODE SNIPPET CARD
    // ==========================================================================
    const codeDataEl = document.getElementById('code-data');
    const codeData = codeDataEl ? JSON.parse(codeDataEl.textContent) : {};
    const codeSnippetEl = document.getElementById('codeSnippet');
    const codeTabButtons = document.querySelectorAll('.code-tab-btn');
    const codeCopyBtn = document.getElementById('codeCopyBtn');
    const codeDownloadBtn = document.getElementById('codeDownloadBtn');
    const activeFileHint = document.getElementById('activeFileHint');

    const fileHints = {
        main: 'FastAPI Developer Profile Endpoint',
        auth: 'OAuth2 Password & JWT Token Issuance',
        model: 'SQLAlchemy Relational Schema',
        attention: 'PyTorch Causal Multi-Head Self-Attention'
    };

    function highlightPython(code) {
        const KEYWORDS = new Set(['async', 'def', 'return', 'if', 'not', 'raise', 'class', 'import', 'from', 'else', 'elif', 'for', 'while', 'in', 'is', 'and', 'or', 'None', 'True', 'False', 'pass', 'with', 'as', 'super']);
        const TYPES = new Set(['Base', 'Column', 'Integer', 'String', 'Float', 'ForeignKey', 'relationship', 'HTTPException', 'OAuth2PasswordRequestForm', 'Depends', 'nn', 'Module', 'Linear', 'math', 'F', 'softmax']);

        const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return code.split('\n').map(line => {
            if (line.trim().startsWith('#')) {
                return `<span class="code-comment">${escapeHtml(line)}</span>`;
            }

            let out = '';
            let i = 0;
            const n = line.length;

            while (i < n) {
                const ch = line[i];

                if (ch === ' ') {
                    out += ' ';
                    i++;
                    continue;
                }

                // Decorator: @name
                if (ch === '@') {
                    let j = i + 1;
                    while (j < n && /[\w.]/.test(line[j])) j++;
                    out += `<span class="code-deco">${escapeHtml(line.slice(i, j))}</span>`;
                    i = j;
                    continue;
                }

                // Strings
                if (ch === '"' || ch === "'") {
                    const quote = ch;
                    let j = i + 1;
                    while (j < n && line[j] !== quote) j++;
                    j = Math.min(j + 1, n);
                    out += `<span class="code-str">${escapeHtml(line.slice(i, j))}</span>`;
                    i = j;
                    continue;
                }

                // Words / Identifiers
                if (/[a-zA-Z_]/.test(ch)) {
                    let j = i + 1;
                    while (j < n && /[\w]/.test(line[j])) j++;
                    const word = line.slice(i, j);
                    const isCall = line[j] === '(';

                    if (KEYWORDS.has(word)) {
                        out += `<span class="code-kw">${word}</span>`;
                    } else if (TYPES.has(word)) {
                        out += `<span class="code-cls">${word}</span>`;
                    } else if (isCall && word !== 'app') {
                        out += `<span class="code-fn">${word}</span>`;
                    } else {
                        out += escapeHtml(word);
                    }
                    i = j;
                    continue;
                }

                out += escapeHtml(ch);
                i++;
            }

            return out;
        }).join('\n');
    }

    function typeCodeFile(key, speed = 8) {
        state.currentCodeFile = key;
        const plainText = codeData[key];
        if (!plainText || !codeSnippetEl) return;

        if (activeFileHint) {
            activeFileHint.textContent = fileHints[key] || 'Python Script';
        }

        codeSnippetEl.textContent = '';
        let i = 0;
        const cursor = document.createElement('span');
        cursor.className = 'code-cursor';
        cursor.textContent = '▌';

        const timer = setInterval(() => {
            i += 4;
            if (i >= plainText.length) {
                clearInterval(timer);
                codeSnippetEl.innerHTML = highlightPython(plainText);
            } else {
                codeSnippetEl.textContent = plainText.slice(0, i);
                codeSnippetEl.appendChild(cursor);
            }
        }, speed);
    }

    codeTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            AudioEngine.playClick(980);
            codeTabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            typeCodeFile(btn.getAttribute('data-file'));
        });
    });

    if (codeCopyBtn) {
        codeCopyBtn.addEventListener('click', () => {
            AudioEngine.playClick(1100);
            navigator.clipboard.writeText(codeData[state.currentCodeFile]).then(() => {
                const original = codeCopyBtn.innerHTML;
                codeCopyBtn.innerHTML = '<span style="font-size:0.7rem;color:#10b981;">✓</span>';
                setTimeout(() => { codeCopyBtn.innerHTML = original; }, 1600);
            });
        });
    }

    if (codeDownloadBtn) {
        codeDownloadBtn.addEventListener('click', () => {
            AudioEngine.playClick(1050);
            const blob = new Blob([codeData[state.currentCodeFile]], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${state.currentCodeFile}.py`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    if (codeSnippetEl) {
        typeCodeFile('main');
    }

    // ==========================================================================
    // 6. 3D TILT CARDS & SPECULAR REFLECTION
    // ==========================================================================
    function initTiltCards() {
        const cards = document.querySelectorAll('[data-tilt]');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -6.5;
                const rotateY = ((x - centerX) / centerX) * 6.5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
                card.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
                card.style.setProperty('--my', `${(y / rect.height) * 100}%`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });
    }

    // Antigravity Float Physics
    let lastMouseX = window.innerWidth / 2;
    let lastMouseY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        document.querySelectorAll('.antigravity').forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementX = rect.left + rect.width / 2;
            const elementY = rect.top + rect.height / 2;

            const deltaX = lastMouseX - elementX;
            const deltaY = lastMouseY - elementY;
            const distance = Math.hypot(deltaX, deltaY);

            const maxDistance = 220;
            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const moveX = (deltaX / distance) * force * 12;
                const moveY = (deltaY / distance) * force * 12;
                element.style.transform = `translate(${moveX}px, ${moveY}px)`;
            } else {
                element.style.transform = 'translate(0, 0)';
            }
        });

        // Spotlight
        document.querySelectorAll('.spotlight').forEach(el => {
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            el.style.setProperty('--mx', `${x}%`);
            el.style.setProperty('--my', `${y}%`);
        });
    });

    // ==========================================================================
    // 7. SKILL TAG -> PROJECTS MODAL & LIVE GITHUB INTEGRATION
    // ==========================================================================
    (function () {
        const overlay = document.getElementById('skillOverlay');
        const modal = document.getElementById('skillModal');
        const closeBtn = document.getElementById('skillModalClose');
        const titleEl = document.getElementById('skillModalTitle');
        const bodyEl = document.getElementById('skillModalBody');

        const GITHUB_USERNAME = 'Yashraj-Arch';
        let ghCache = null;

        function getProjects() {
            return Array.from(document.querySelectorAll('.project-card'));
        }

        function timeAgo(dateStr) {
            const diffMs = Date.now() - new Date(dateStr).getTime();
            const days = Math.floor(diffMs / 86400000);
            if (days < 1) return 'today';
            if (days < 30) return `${days}d ago`;
            const months = Math.floor(days / 30);
            if (months < 12) return `${months}mo ago`;
            return `${Math.floor(months / 12)}y ago`;
        }

        async function openGitHubCard() {
            AudioEngine.playClick(1000);
            titleEl.textContent = 'Git / GitHub';
            overlay.classList.add('visible');
            modal.classList.add('visible');

            if (ghCache) {
                bodyEl.innerHTML = ghCache;
                return;
            }

            bodyEl.innerHTML = `
                <div class="gh-profile">
                    <div style="width:58px;height:58px;border-radius:50%;background:rgba(128,128,128,0.2);"></div>
                    <div style="flex:1;">
                        <div style="width:140px;height:14px;background:rgba(128,128,128,0.2);margin-bottom:8px;border-radius:4px;"></div>
                        <div style="width:200px;height:11px;background:rgba(128,128,128,0.2);border-radius:4px;"></div>
                    </div>
                </div>
                <div style="padding:1.5rem 0;text-align:center;color:var(--text-muted);">Fetching live GitHub repositories…</div>
            `;

            try {
                const [userRes, reposRes] = await Promise.all([
                    fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
                    fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=5`)
                ]);

                if (!userRes.ok || !reposRes.ok) throw new Error('GitHub API request failed');

                const user = await userRes.json();
                const repos = await reposRes.json();

                const reposHtml = Array.isArray(repos) && repos.length > 0
                    ? repos.map(r => `
                        <div class="gh-repo">
                            <div class="gh-repo-top">
                                <a href="${r.html_url}" target="_blank" rel="noopener noreferrer" class="gh-repo-name">${r.name}</a>
                                <div class="gh-repo-meta">
                                    ${r.language ? `<span class="gh-lang-dot"></span><span>${r.language}</span>` : ''}
                                    <span>★ ${r.stargazers_count}</span>
                                    <span>·</span>
                                    <span>${timeAgo(r.pushed_at)}</span>
                                </div>
                            </div>
                            ${r.description ? `<div class="gh-repo-desc">${r.description}</div>` : ''}
                        </div>
                    `).join('')
                    : `<div style="padding:1rem 0;color:var(--text-muted);">No public repositories found.</div>`;

                const html = `
                    <div class="gh-profile">
                        <img class="gh-avatar" src="${user.avatar_url}" alt="${user.login} on GitHub">
                        <div class="gh-profile-info">
                            <h4>${user.name || user.login}</h4>
                            <p>${user.bio || `@${user.login}`}</p>
                            <div class="gh-profile-stats">
                                <span><strong>${user.public_repos}</strong> repos</span>
                                <span><strong>${user.followers}</strong> followers</span>
                            </div>
                        </div>
                        <a href="${user.html_url}" target="_blank" rel="noopener noreferrer" class="gh-profile-link">View Profile</a>
                    </div>
                    <div class="gh-repos-label">Recently Updated Repositories</div>
                    ${reposHtml}
                `;

                ghCache = html;
                bodyEl.innerHTML = html;
            } catch (err) {
                bodyEl.innerHTML = `
                    <div style="padding:1.5rem 0;text-align:center;color:var(--text-muted);">
                        Couldn't load live GitHub data right now.<br>
                        <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:600;">View profile directly on GitHub →</a>
                    </div>
                `;
            }
        }

        function openForSkill(skillLabel) {
            AudioEngine.playClick(950);
            const key = skillLabel.trim().toLowerCase();

            if (key === 'git / github') {
                openGitHubCard();
                return;
            }

            titleEl.textContent = skillLabel;

            const matches = getProjects().filter(card => {
                const tags = (card.getAttribute('data-tags') || '').split(',').map(t => t.trim());
                return tags.includes(key);
            });

            bodyEl.innerHTML = '';
            if (matches.length === 0) {
                bodyEl.innerHTML = `<div style="padding:1rem 0;color:var(--text-muted);">This skill is applied in day-to-day architecture across my backend engineering work.</div>`;
            } else {
                matches.forEach(card => {
                    const title = card.querySelector('.project-title')?.textContent || '';
                    const desc = card.querySelector('.project-description')?.textContent.trim() || '';
                    const link = card.querySelector('.project-link');
                    const wrap = document.createElement('div');
                    wrap.className = 'skill-modal-project';
                    wrap.innerHTML = `
                        <h4>${title}</h4>
                        <p>${desc}</p>
                        ${link ? `<a href="${link.getAttribute('href')}" target="_blank" rel="noopener noreferrer">Read full analysis →</a>` : `<a href="#projects" class="skill-modal-jump">View in projects →</a>`}
                    `;
                    bodyEl.appendChild(wrap);
                });
            }

            overlay.classList.add('visible');
            modal.classList.add('visible');
        }

        function closeModal() {
            overlay.classList.remove('visible');
            modal.classList.remove('visible');
        }

        document.querySelectorAll('.skill-tag').forEach(tag => {
            tag.addEventListener('click', () => openForSkill(tag.textContent));
        });

        bodyEl.addEventListener('click', (e) => {
            const jumpLink = e.target.closest('.skill-modal-jump');
            if (jumpLink) {
                e.preventDefault();
                closeModal();
                scrollToSection('projects');
            }
        });

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
        });
    })();

    // ==========================================================================
    // 8. COMMAND PALETTE (Cmd+K / Ctrl+K)
    // ==========================================================================
    (function () {
        const overlay = document.getElementById('cmdkOverlay');
        const modal = document.getElementById('cmdkModal');
        const input = document.getElementById('cmdkInput');
        const list = document.getElementById('cmdkList');
        const trigger = document.getElementById('cmdkTrigger');
        const keyHint = document.getElementById('cmdkKeyHint');

        const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
        if (keyHint) keyHint.textContent = isMac ? '⌘ K' : 'Ctrl K';

        const commands = [
            { label: 'Home', sub: 'Go to top', type: 'section', target: 'home' },
            { label: 'About', sub: 'Background & skills', type: 'section', target: 'about' },
            { label: 'Experience', sub: 'Work history', type: 'section', target: 'experience' },
            { label: 'Achievements', sub: 'Academic & cultural', type: 'section', target: 'achievements' },
            { label: 'Projects', sub: 'Things I built', type: 'section', target: 'projects' },
            { label: 'Contact', sub: 'Get in touch', type: 'section', target: 'contact' },
            { label: 'Email me', sub: 'yashraj241103@gmail.com', type: 'link', target: 'mailto:yashraj241103@gmail.com' },
            { label: 'GitHub', sub: 'github.com/Yashraj-Arch', type: 'link', target: 'https://github.com/Yashraj-Arch' },
            { label: 'LinkedIn', sub: 'linkedin.com/in/yashraj-arch', type: 'link', target: 'https://www.linkedin.com/in/yashraj-arch' },
            { label: 'Toggle dark mode', sub: 'Switch theme', type: 'action', target: 'theme' }
        ];

        let activeIndex = 0;
        let filtered = commands;

        function renderList() {
            list.innerHTML = '';
            if (filtered.length === 0) {
                list.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--text-muted);">No results found</div>';
                return;
            }
            filtered.forEach((cmd, idx) => {
                const item = document.createElement('div');
                item.className = 'cmdk-item' + (idx === activeIndex ? ' active' : '');
                item.innerHTML = `
                    <span>${cmd.label}</span>
                    <span class="cmdk-item-sub">${cmd.sub}</span>
                `;
                item.addEventListener('click', () => runCommand(cmd));
                item.addEventListener('mouseenter', () => {
                    activeIndex = idx;
                    renderList();
                });
                list.appendChild(item);
            });
        }

        function runCommand(cmd) {
            AudioEngine.playClick(1050);
            closePalette();
            if (cmd.type === 'section') {
                scrollToSection(cmd.target);
            } else if (cmd.type === 'link') {
                window.open(cmd.target, '_blank', 'noopener,noreferrer');
            } else if (cmd.type === 'action' && cmd.target === 'theme') {
                document.getElementById('themeToggle').click();
            }
        }

        function openPalette() {
            AudioEngine.playClick(1000);
            overlay.classList.add('visible');
            modal.classList.add('visible');
            input.value = '';
            filtered = commands;
            activeIndex = 0;
            renderList();
            setTimeout(() => input.focus(), 50);
        }

        function closePalette() {
            overlay.classList.remove('visible');
            modal.classList.remove('visible');
        }

        input.addEventListener('input', () => {
            const q = input.value.toLowerCase().trim();
            filtered = q ? commands.filter(c => c.label.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q)) : commands;
            activeIndex = 0;
            renderList();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
                renderList();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                renderList();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered[activeIndex]) runCommand(filtered[activeIndex]);
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                modal.classList.contains('visible') ? closePalette() : openPalette();
            } else if (e.key === 'Escape' && modal.classList.contains('visible')) {
                closePalette();
            }
        });

        if (trigger) trigger.addEventListener('click', openPalette);
        if (overlay) overlay.addEventListener('click', closePalette);
    })();

    // ==========================================================================
    // 9. NAVIGATION, SCROLL REVEAL & BACK TO TOP
    // ==========================================================================
    window.scrollToSection = function (id) {
        AudioEngine.playClick(900);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            const navLinks = document.getElementById('navLinks');
            const mobileMenu = document.getElementById('mobile-menu');
            if (navLinks) navLinks.classList.remove('active');
            if (mobileMenu) mobileMenu.classList.remove('active');
        }
    };

    window.toggleMenu = function () {
        AudioEngine.playClick(900);
        const navLinks = document.getElementById('navLinks');
        const mobileMenu = document.getElementById('mobile-menu');
        if (navLinks) navLinks.classList.toggle('active');
        if (mobileMenu) mobileMenu.classList.toggle('active');
    };

    // Scroll listener for Navbar & Back to Top
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const backToTop = document.getElementById('backToTop');

        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        if (backToTop) {
            if (window.scrollY > 450) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }

        // Active link tracking
        const sections = ['home', 'about', 'experience', 'achievements', 'projects', 'contact'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            const link = document.querySelector(`.nav-links a[href="#${sectionId}"]`);
            if (section && link) {
                const rect = section.getBoundingClientRect();
                if (rect.top <= 120 && rect.bottom >= 120) {
                    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });

        // Scroll reveals
        document.querySelectorAll('.reveal').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight - 100) {
                el.classList.add('active');
            }
        });
    }, { passive: true });

    const bttBtn = document.getElementById('backToTop');
    if (bttBtn) {
        bttBtn.addEventListener('click', () => {
            AudioEngine.playClick(1000);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Dynamic latency jitter
    setInterval(() => {
        const lat = document.getElementById('latencyDisplay');
        if (lat) {
            lat.textContent = `${Math.floor(18 + Math.random() * 8)}ms`;
        }
    }, 3000);

    // Initial triggers
    document.addEventListener('DOMContentLoaded', () => {
        init3DBackground();
        initTiltCards();
        document.querySelectorAll('.reveal').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight - 50) {
                el.classList.add('active');
            }
        });
    });

})();
