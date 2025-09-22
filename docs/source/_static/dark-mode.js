// Dark mode toggle functionality
(function() {
    'use strict';

    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // Apply the theme immediately to prevent flash
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Wait for DOM to be ready
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    ready(function() {
        // Create the theme toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle';
        toggleButton.setAttribute('aria-label', 'Toggle dark mode');
        toggleButton.setAttribute('title', 'Toggle dark/light mode');
        
        // Set initial title based on current theme
        updateToggleTitle(toggleButton, initialTheme);
        
        // Add click event listener
        toggleButton.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Apply new theme
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update button title
            updateToggleTitle(toggleButton, newTheme);
            
            // Announce theme change for screen readers
            announceThemeChange(newTheme);
        });
        
        // Add the button to the page
        document.body.appendChild(toggleButton);
        
        // Handle system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener(function(e) {
                // Only auto-switch if no manual preference is saved
                if (!localStorage.getItem('theme-manual')) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', systemTheme);
                    updateToggleTitle(toggleButton, systemTheme);
                }
            });
        }
        
        // Keyboard navigation support
        document.addEventListener('keydown', function(e) {
            // Toggle theme with Ctrl/Cmd + Shift + D
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                toggleButton.click();
            }
        });
    });

    function updateToggleTitle(button, theme) {
        if (theme === 'dark') {
            button.setAttribute('title', 'Switch to light mode');
            button.setAttribute('aria-label', 'Switch to light mode');
        } else {
            button.setAttribute('title', 'Switch to dark mode');
            button.setAttribute('aria-label', 'Switch to dark mode');
        }
    }

    function announceThemeChange(theme) {
        // Create a temporary element for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        announcement.textContent = `Switched to ${theme} mode`;
        document.body.appendChild(announcement);
        
        // Remove the announcement after a short delay
        setTimeout(function() {
            document.body.removeChild(announcement);
        }, 1000);
    }

})();
