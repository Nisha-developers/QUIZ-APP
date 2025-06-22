    const headline = document.querySelector('.headline');
        const toggleBtn = document.getElementById('toggle');
        const seniorClass = document.querySelectorAll('.senior-class, .container-sec, .classes');
        const menuToggle = document.getElementById('menu-toggle');
        const mobileNav = document.getElementById('mobileNav');
        const closeNav = document.getElementById('closeNav');
        const allDropdownItems = document.querySelectorAll('li, .container-sec > div');
        const header = document.querySelector('header');
        const allLinks = document.querySelectorAll('a');
        

        // Split headline into words and animate them
        const words = headline.textContent.trim().split(' ');
        headline.innerHTML = '';

        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word;
            span.style.setProperty('--delay', `${index * 0.5}s`);
            headline.appendChild(span);
        });

        // Toggle theme function
       // Select DOM elements


// Apply saved theme on page load
const savedMode = localStorage.getItem('theme'); // key changed to 'theme' for clarity

if (savedMode === 'light') {
    document.body.classList.add('light-mode');
    toggleBtn.textContent = '🌙';
    toggleBtn.setAttribute('title', 'Dark Mode');
    header.style.backgroundColor = 'rgb(221, 221, 149)';
    seniorClass.forEach(el => el.classList.add('lightMode'));
} else {
    // If dark mode or nothing saved, apply dark mode by default
    document.body.classList.remove('light-mode');
    toggleBtn.textContent = '☀️';
    toggleBtn.setAttribute('title', 'Light Mode');
    header.style.backgroundColor = 'black';
      allLinks.forEach((allLinks)=>{
          allLinks.classList.add('links');
        })
    seniorClass.forEach(el => el.classList.remove('lightMode'));
}

// Toggle function
function toggleMode() {
    const isLight = document.body.classList.contains('light-mode');

    if (isLight) {
        // Switch to dark mode
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        toggleBtn.textContent = '☀️';
        toggleBtn.setAttribute('title', 'Light Mode');
        header.style.backgroundColor = 'black';
        seniorClass.forEach(el => el.classList.remove('lightMode'));
        allLinks.forEach((allLinks)=>{
          allLinks.classList.add('links');
        })
    } else {
        // Switch to light mode
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        toggleBtn.textContent = '🌙';
        toggleBtn.setAttribute('title', 'Dark Mode');
        header.style.backgroundColor = 'rgb(221, 221, 149)';
        seniorClass.forEach(el => el.classList.add('lightMode'));
    }
}


        // Function to toggle dropdown icon on hover for desktop navigation
        function toggleDropdownIconOnHover(elements) {
            elements.forEach(item => {
                const dropdown = item.querySelector('.container-sec, .senior-class');
                const icon = item.querySelector('i');

                if (!icon) return;

                item.addEventListener('mouseenter', () => {
                    icon.classList.remove('fa-caret-up');
                    icon.classList.add('fa-caret-down');
                });

                item.addEventListener('mouseleave', () => {
                    icon.classList.remove('fa-caret-down');
                    icon.classList.add('fa-caret-up');
                });
            });
        }

        // Call once for desktop dropdowns
        toggleDropdownIconOnHover(allDropdownItems);

        // Open mobile menu
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.add('open');
        });

        // Close mobile menu
        closeNav.addEventListener('click', () => {
            mobileNav.classList.remove('open');
        });

        // Mobile dropdown functionality
        const mobileDropdownTriggers = document.querySelectorAll('.mobile-nav > ul > li[data-dropdown]');
        const mobileSubDropdownTriggers = document.querySelectorAll('.mobile-nav .classes[data-dropdown]');

        // Handle main dropdown toggles
        mobileDropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = trigger.querySelector('.mobile-dropdown');
                const icon = trigger.querySelector('i');
                
                // Close other main dropdowns
                mobileDropdownTriggers.forEach(otherTrigger => {
                    if (otherTrigger !== trigger) {
                        const otherDropdown = otherTrigger.querySelector('.mobile-dropdown');
                        const otherIcon = otherTrigger.querySelector('i');
                        otherDropdown.classList.remove('active');
                        otherTrigger.classList.remove('dropdown-active');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('active');
                trigger.classList.toggle('dropdown-active');
            });
        });

        // Handle sub-dropdown toggles (SSS classes)
        mobileSubDropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const subDropdown = trigger.querySelector('.mobile-sub-dropdown');
                const icon = trigger.querySelector('i');
                
                // Close other sub-dropdowns in the same parent
                const parentDropdown = trigger.closest('.mobile-dropdown');
                const siblingSubTriggers = parentDropdown.querySelectorAll('.classes[data-dropdown]');
                
                siblingSubTriggers.forEach(otherTrigger => {
                    if (otherTrigger !== trigger) {
                        const otherSubDropdown = otherTrigger.querySelector('.mobile-sub-dropdown');
                        otherSubDropdown.classList.remove('active');
                        otherTrigger.classList.remove('dropdown-active');
                    }
                });
                
                // Toggle current sub-dropdown
                subDropdown.classList.toggle('active');
                trigger.classList.toggle('dropdown-active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
                mobileNav.classList.remove('open');
            }
        });

        // Prevent dropdown from closing when clicking inside it
        mobileNav.addEventListener('click', (e) => {
            e.stopPropagation();
        });
