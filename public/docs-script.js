class DocsNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.initScrollSpy();
        this.initTabSwitching();
        this.copyCodeBlocks();
    }

    bindEvents() {
        // Navigation link clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                this.setActiveNav(link);
            });
        });

        // Mobile menu toggle (if needed)
        this.addMobileMenuToggle();
    }

    scrollToSection(targetId) {
        const target = document.getElementById(targetId);
        if (target) {
            const offset = 80; // Account for any fixed headers
            const targetPosition = target.offsetTop - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    setActiveNav(activeLink) {
        // Remove active class from all links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        activeLink.classList.add('active');
    }

    initScrollSpy() {
        const sections = document.querySelectorAll('.doc-section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                    
                    if (correspondingLink) {
                        navLinks.forEach(link => link.classList.remove('active'));
                        correspondingLink.classList.add('active');
                    }
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    initTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                const targetPanel = document.getElementById(targetTab);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }

    copyCodeBlocks() {
        // Add copy buttons to code blocks
        document.querySelectorAll('pre').forEach(pre => {
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-btn';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copy code';
            
            copyButton.addEventListener('click', () => {
                const code = pre.querySelector('code');
                const text = code ? code.textContent : pre.textContent;
                
                navigator.clipboard.writeText(text).then(() => {
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    copyButton.style.color = '#10b981';
                    
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                        copyButton.style.color = '';
                    }, 2000);
                }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    copyButton.style.color = '#10b981';
                    
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                        copyButton.style.color = '';
                    }, 2000);
                });
            });
            
            pre.style.position = 'relative';
            pre.appendChild(copyButton);
        });
    }

    addMobileMenuToggle() {
        // Create mobile menu button if on mobile
        if (window.innerWidth <= 768) {
            const menuButton = document.createElement('button');
            menuButton.className = 'mobile-menu-btn';
            menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            menuButton.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 101;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                font-size: 16px;
            `;
            
            menuButton.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('open');
            });
            
            document.body.appendChild(menuButton);
            
            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                const sidebar = document.querySelector('.sidebar');
                const menuButton = document.querySelector('.mobile-menu-btn');
                
                if (!sidebar.contains(e.target) && !menuButton.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }
}

// API Status Checker
class APIStatusChecker {
    constructor() {
        this.checkStatus();
        // Check status every 30 seconds
        setInterval(() => this.checkStatus(), 30000);
    }

    async checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            this.updateStatusLinks(data);
        } catch (error) {
            console.warn('Could not check API status:', error);
        }
    }

    updateStatusLinks(data) {
        const statusLink = document.querySelector('.status-link');
        if (statusLink && data.success) {
            const availableServices = data.available_services || 0;
            const totalServices = data.total_services || 3;
            
            statusLink.innerHTML = `
                <i class="fas fa-heartbeat"></i>
                API Status (${availableServices}/${totalServices} services)
            `;
            
            if (availableServices === totalServices) {
                statusLink.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                statusLink.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                statusLink.style.color = '#10b981';
            } else if (availableServices > 0) {
                statusLink.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                statusLink.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                statusLink.style.color = '#f59e0b';
            } else {
                statusLink.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                statusLink.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                statusLink.style.color = '#ef4444';
            }
        }
    }
}

// Live API Testing
class LiveAPITester {
    constructor() {
        this.addTestButtons();
    }

    addTestButtons() {
        // Add "Try it" buttons to endpoint examples
        document.querySelectorAll('.endpoint-card').forEach(card => {
            const method = card.querySelector('.method');
            const path = card.querySelector('.path');
            
            if (method && path && (method.textContent === 'POST' || method.textContent === 'GET')) {
                const testButton = document.createElement('button');
                testButton.className = 'test-endpoint-btn';
                testButton.innerHTML = '<i class="fas fa-play"></i> Try it';
                testButton.style.cssText = `
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 16px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                `;
                
                testButton.addEventListener('click', () => {
                    this.testEndpoint(method.textContent, path.textContent);
                });
                
                const header = card.querySelector('.endpoint-header');
                header.appendChild(testButton);
            }
        });
    }

    async testEndpoint(method, path) {
        const button = event.target;
        const originalText = button.innerHTML;
          button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        button.disabled = true;
        
        try {
            let response;
            const url = `https://jarvis-api.herokuapp.com${path}`;
            
            if (method === 'GET') {
                response = await fetch(url);
            } else if (method === 'POST') {
                const testData = this.getTestData(path);
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testData)
                });
            }
            
            const data = await response.json();
            this.showResult(data, response.status);
            
        } catch (error) {
            this.showResult({ error: error.message }, 500);
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    getTestData(path) {
        switch (path) {
            case '/api/chat':
                return { message: 'Hello from the documentation page!' };
            case '/api/test':
                return { message: 'Test message from docs' };
            default:
                return {};
        }
    }

    showResult(data, status) {
        // Create modal to show result
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;
        
        const statusColor = status >= 200 && status < 300 ? '#10b981' : '#ef4444';
        
        modal.innerHTML = `
            <div style="
                background: #1a1f2e;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 32px;
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: white; margin: 0;">API Response</h3>
                    <button id="closeModal" style="
                        background: none;
                        border: none;
                        color: #94a3b8;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 4px;
                    ">×</button>
                </div>
                <div style="margin-bottom: 16px;">
                    <span style="color: ${statusColor}; font-weight: 600;">Status: ${status}</span>
                </div>
                <pre style="
                    background: #0d1117;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 20px;
                    color: #e2e8f0;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                    overflow-x: auto;
                    margin: 0;
                ">${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal events
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        modal.querySelector('#closeModal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
}

// Add CSS for copy buttons
const copyButtonStyles = document.createElement('style');
copyButtonStyles.textContent = `
    .copy-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 6px;
        color: #3b82f6;
        padding: 8px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
        z-index: 10;
    }
    
    .copy-btn:hover {
        background: rgba(59, 130, 246, 0.3);
        transform: scale(1.05);
    }
`;
document.head.appendChild(copyButtonStyles);

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocsNavigation();
    new APIStatusChecker();
    new LiveAPITester();
    
    // Add smooth reveal animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    // Observe sections for animation
    document.querySelectorAll('.doc-section, .feature-card, .endpoint-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
