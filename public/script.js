class JarvisChat {
    constructor() {
        this.currentService = 'auto';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkSystemStatus();
        this.autoResizeTextarea();
    }

    bindEvents() {
        // Send message events
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        
        sendButton.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Service selection
        const serviceInputs = document.querySelectorAll('input[name="service"]');
        serviceInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.currentService = e.target.value;
                this.updateServiceStatus();
            });
        });

        // Control events
        document.getElementById('clearButton').addEventListener('click', () => this.clearChat());
        document.getElementById('testServices').addEventListener('click', () => this.testServices());

        // Range inputs
        const tempSlider = document.getElementById('temperature');
        const tokensSlider = document.getElementById('maxTokens');
        
        tempSlider.addEventListener('input', (e) => {
            document.getElementById('tempValue').textContent = e.target.value;
        });
        
        tokensSlider.addEventListener('input', (e) => {
            document.getElementById('tokensValue').textContent = e.target.value;
        });
    }

    autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }

    async checkSystemStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            this.updateStatusIndicator('online', `${data.available_services} services available`);
            
            // Update service availability in UI
            this.updateServiceAvailability(data.services);
        } catch (error) {
            this.updateStatusIndicator('error', 'Connection failed');
        }
    }

    updateStatusIndicator(status, message) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        
        indicator.className = `status-indicator ${status}`;
        text.textContent = message;
    }

    updateServiceAvailability(services) {
        const serviceOptions = document.querySelectorAll('.service-option');
        
        serviceOptions.forEach((option, index) => {
            const input = option.querySelector('input[type="radio"]');
            const serviceInfo = option.querySelector('.service-info small');
            
            if (input.value === 'auto') return; // Skip auto option
            
            const serviceIndex = parseInt(input.value);
            const isAvailable = services && services[serviceIndex] && services[serviceIndex].available;
            
            if (!isAvailable) {
                option.style.opacity = '0.5';
                serviceInfo.textContent = 'Unavailable - Missing API key';
            }
        });
    }

    updateServiceStatus() {
        const serviceNames = ['Google Gemini', 'GitHub OpenAI', 'OpenRouter'];
        const serviceName = this.currentService === 'auto' 
            ? 'Auto Priority System' 
            : serviceNames[parseInt(this.currentService)];
            
        console.log(`Switched to: ${serviceName}`);
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message || this.isLoading) return;

        // Get current settings
        const temperature = parseFloat(document.getElementById('temperature').value);
        const maxTokens = parseInt(document.getElementById('maxTokens').value);

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Show loading
        this.setLoading(true);
        
        try {
            const endpoint = this.currentService === 'auto' 
                ? '/api/chat' 
                : `/api/test/${this.currentService}`;
                
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    temperature,
                    max_tokens: maxTokens
                })
            });

            // Parse the response as text first to handle potential chunked responses
            const responseText = await response.text();
            
            // Try to parse the JSON response
            let data;
            try {
                // Get the last valid JSON object from the response
                // This handles cases where there might be multiple JSON objects in chunked responses
                const jsonStr = responseText.trim().split('\n\n').pop();
                data = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                throw new Error('Invalid response from server');
            }
            
            if (data.success) {
                this.addMessage(data.response, 'assistant', data.metadata?.provider || 'Unknown');
            } else {
                this.addMessage(`Error: ${data.error}`, 'assistant', 'Error');
            }
        } catch (error) {
            this.addMessage(`Connection error: ${error.message}`, 'assistant', 'Error');
        } finally {
            this.setLoading(false);
        }
    }

    addMessage(content, type, service = null) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const currentTime = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const avatar = type === 'user' 
            ? '<i class="fas fa-user"></i>'
            : '<i class="fas fa-robot"></i>';
            
        const serviceTag = service 
            ? `<span class="message-service">${service}</span>`
            : '';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${avatar}
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                <div class="message-info">
                    <span class="message-time">${currentTime}</span>
                    ${serviceTag}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatMessage(content) {
        // Basic formatting for code blocks and line breaks
        return content
            .replace(/\n/g, '<br>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```([^```]+)```/g, '<pre><code>$1</code></pre>');
    }

    setLoading(loading) {
        this.isLoading = loading;
        const loadingOverlay = document.getElementById('loadingOverlay');
        const sendButton = document.getElementById('sendButton');
        const loadingService = document.getElementById('loadingService');
        
        if (loading) {
            loadingOverlay.classList.add('active');
            sendButton.disabled = true;
            
            const serviceNames = ['Google Gemini', 'GitHub OpenAI', 'OpenRouter'];
            const serviceName = this.currentService === 'auto' 
                ? 'Trying best available service...' 
                : `Using ${serviceNames[parseInt(this.currentService)]}...`;
                
            loadingService.textContent = serviceName;
        } else {
            loadingOverlay.classList.remove('active');
            sendButton.disabled = false;
        }
    }

    clearChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="message assistant">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        Chat cleared! I'm ready for a new conversation. How can I help you?
                    </div>
                    <div class="message-info">
                        <span class="message-time">Just now</span>
                        <span class="message-service">System</span>
                    </div>
                </div>
            </div>
        `;
    }

    async testServices() {
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Test message - please respond with your service name'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                let resultMessage = '🧪 **Service Test Results:**\n\n';
                
                data.results.forEach((result, index) => {
                    const serviceNames = ['Google Gemini', 'GitHub OpenAI', 'OpenRouter'];
                    const status = result.success ? '✅' : '❌';
                    const response = result.success 
                        ? `Response: "${result.response.substring(0, 50)}..."` 
                        : `Error: ${result.error}`;
                    
                    resultMessage += `${status} **${serviceNames[index]}**: ${response}\n\n`;
                });
                
                this.addMessage(resultMessage, 'assistant', 'Test Results');
            } else {
                this.addMessage(`Test failed: ${data.error}`, 'assistant', 'Error');
            }
        } catch (error) {
            this.addMessage(`Test error: ${error.message}`, 'assistant', 'Error');
        } finally {
            this.setLoading(false);
        }
    }
}

// Initialize the chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JarvisChat();
});

// Add some visual enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add typing effect to the initial message
    const initialMessage = document.querySelector('.message-text');
    if (initialMessage) {
        const text = initialMessage.textContent;
        initialMessage.textContent = '';
        
        let index = 0;
        const typeWriter = () => {
            if (index < text.length) {
                initialMessage.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 30);
            }
        };
        
        setTimeout(typeWriter, 500);
    }
    
    // Add particle effect (optional)
    createParticles();
});

function createParticles() {
    const particleCount = 50;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '2px';
        particle.style.height = '2px';
        particle.style.background = 'rgba(0, 212, 255, 0.3)';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '-1';
        
        // Random position
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = Math.random() * window.innerHeight + 'px';
        
        document.body.appendChild(particle);
        particles.push({
            element: particle,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }
    
    function animateParticles() {
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = window.innerWidth;
            if (particle.x > window.innerWidth) particle.x = 0;
            if (particle.y < 0) particle.y = window.innerHeight;
            if (particle.y > window.innerHeight) particle.y = 0;
            
            particle.element.style.left = particle.x + 'px';
            particle.element.style.top = particle.y + 'px';
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
}
