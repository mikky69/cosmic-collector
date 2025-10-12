/**
 * Mobile Touch Controls System
 * Provides virtual joystick and touch buttons for mobile gameplay
 */

class MobileControls {
    constructor() {
        this.isEnabled = this.isMobileDevice();
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickPosition = { x: 0, y: 0 };
        this.maxDistance = 50;
        
        // Control states
        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false,
            special: false
        };

        this.init();
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }

    init() {
        if (!this.isEnabled) {
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls) {
                mobileControls.style.display = 'none';
            }
            return;
        }

        this.setupJoystick();
        this.setupActionButtons();
        this.showControls();
    }

    setupJoystick() {
        const joystickBase = document.querySelector('.joystick-base');
        const joystickHandle = document.getElementById('joystick-handle');

        if (!joystickBase || !joystickHandle) return;

        // Touch events for joystick
        joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startJoystick(e.touches[0]);
        });

        document.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.moveJoystick(e.touches[0]);
            }
        });

        document.addEventListener('touchend', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.endJoystick();
            }
        });

        // Mouse events for testing on desktop
        joystickBase.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startJoystick(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.moveJoystick(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.endJoystick();
            }
        });
    }

    startJoystick(touch) {
        const rect = document.querySelector('.joystick-base').getBoundingClientRect();
        this.joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        this.joystickActive = true;
        this.moveJoystick(touch);
    }

    moveJoystick(touch) {
        const deltaX = touch.clientX - this.joystickCenter.x;
        const deltaY = touch.clientY - this.joystickCenter.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance <= this.maxDistance) {
            this.joystickPosition = { x: deltaX, y: deltaY };
        } else {
            const angle = Math.atan2(deltaY, deltaX);
            this.joystickPosition = {
                x: Math.cos(angle) * this.maxDistance,
                y: Math.sin(angle) * this.maxDistance
            };
        }

        // Update visual position
        const handle = document.getElementById('joystick-handle');
        if (handle) {
            handle.style.transform = `translate(${this.joystickPosition.x}px, ${this.joystickPosition.y}px)`;
        }

        // Update control states
        this.updateControlStates();
    }

    endJoystick() {
        this.joystickActive = false;
        this.joystickPosition = { x: 0, y: 0 };

        // Reset visual position
        const handle = document.getElementById('joystick-handle');
        if (handle) {
            handle.style.transform = 'translate(0px, 0px)';
        }

        // Reset control states
        this.controls.up = false;
        this.controls.down = false;
        this.controls.left = false;
        this.controls.right = false;
    }

    updateControlStates() {
        const threshold = 20;
        
        this.controls.up = this.joystickPosition.y < -threshold;
        this.controls.down = this.joystickPosition.y > threshold;
        this.controls.left = this.joystickPosition.x < -threshold;
        this.controls.right = this.joystickPosition.x > threshold;
    }

    setupActionButtons() {
        const fireButton = document.getElementById('mobile-fire');
        const specialButton = document.getElementById('mobile-special');

        if (fireButton) {
            fireButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.controls.fire = true;
                fireButton.classList.add('pressed');
            });

            fireButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.controls.fire = false;
                fireButton.classList.remove('pressed');
            });

            // Mouse events for testing
            fireButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.controls.fire = true;
                fireButton.classList.add('pressed');
            });

            fireButton.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.controls.fire = false;
                fireButton.classList.remove('pressed');
            });
        }

        if (specialButton) {
            specialButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.controls.special = true;
                specialButton.classList.add('pressed');
            });

            specialButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.controls.special = false;
                specialButton.classList.remove('pressed');
            });

            // Mouse events for testing
            specialButton.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.controls.special = true;
                specialButton.classList.add('pressed');
            });

            specialButton.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.controls.special = false;
                specialButton.classList.remove('pressed');
            });
        }
    }

    showControls() {
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls && this.isEnabled) {
            mobileControls.style.display = 'flex';
        }
    }

    hideControls() {
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }
    }

    // Public methods for games to check control states
    isPressed(control) {
        return this.controls[control] || false;
    }

    getJoystickVector() {
        if (!this.joystickActive) return { x: 0, y: 0 };
        
        return {
            x: this.joystickPosition.x / this.maxDistance,
            y: this.joystickPosition.y / this.maxDistance
        };
    }

    // Vibration feedback for mobile devices
    vibrate(duration = 50) {
        if (navigator.vibrate && this.isEnabled) {
            navigator.vibrate(duration);
        }
    }
}

// Global mobile controls instance
window.mobileControls = new MobileControls();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileControls;
}