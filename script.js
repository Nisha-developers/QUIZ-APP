const headline = document.querySelector('.headline');
        const toggleBtn = document.getElementById('toggle');
        const seniorClass = document.querySelectorAll('.senior-class, .container-sec, .classes');
        const allDropdownItems = document.querySelectorAll('li, .container-sec > div');
        const aside = document.querySelector('aside');
        const allLinks = document.querySelectorAll('a');
        const closess = document.querySelector('.fa-times');
        const linkaside = document.querySelector('aside');
        const navigationAll = document.querySelectorAll('nav ul li');
        const toggleLogo = document.querySelector('.toggle-logo');

        // Split headline into words and animate them
        const words = headline.textContent.trim().split(' ');
        headline.innerHTML = '';

        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word;
            span.style.setProperty('--delay', `${index * 0.5}s`);
            headline.appendChild(span);
        });

        // Function to detect if device is mobile
        function isMobileDevice() {
            return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        // Function to toggle dropdown icon on hover for desktop navigation
        function toggleDropdownIconOnHover(elements) {
            if (!isMobileDevice()) {
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
        }

        // Function to handle mobile navigation clicks
      function handleMobileNavigation() {
    // Select all items that can act as an accordion/dropdown toggle
    const accordionItems = document.querySelectorAll('.nav-item, .classes');

    accordionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // This is the element that was actually clicked
            const target = e.target;

            // This is the main link that should trigger the toggle (e.g., "Student Details >")
            const triggerLink = item.querySelector('a');

            // --- The Fix ---
            // We only want to toggle the dropdown if the click was ON the trigger link itself.
            // If the click was on anything else inside the item (like a link in the dropdown),
            // we do nothing and let the link work normally.
            if (target !== triggerLink && !triggerLink.contains(target)) {
                return; // Exit the function, don't toggle anything.
            }

            // Prevent the link from navigating away
            e.preventDefault();
            // Stop the event from bubbling up to parent dropdowns
            e.stopPropagation();

            const wasActive = item.classList.contains('active');

            // Close all other accordion items at the same level
            accordionItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherIcon = otherItem.querySelector('i');
                    if (otherIcon) {
                        otherIcon.classList.remove('fa-caret-down');
                        otherIcon.classList.add('fa-caret-up');
                    }
                }
            });

            // Toggle the current item only if it wasn't already active
            // or if a different item was clicked. This creates a clean accordion.
            if (!wasActive) {
                item.classList.add('active');
            }

            // Update the icon for the current item
            const icon = item.querySelector('i');
            if (icon) {
                if (item.classList.contains('active')) {
                    icon.classList.remove('fa-caret-up');
                    icon.classList.add('fa-caret-down');
                } else {
                    icon.classList.remove('fa-caret-down');
                    icon.classList.add('fa-caret-up');
                }
            }
        });
    });
}

    
function handleDesktopStickyClick() {
    const classItems = document.querySelectorAll('.classes');

    classItems.forEach(item => {
        item.addEventListener('click', function(e) {
 

            const wasSticky = this.classList.contains('stay-open');

            
            classItems.forEach(el => el.classList.remove('stay-open'));
            if (!wasSticky) {
                this.classList.add('stay-open');
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('aside')) {
            classItems.forEach(item => {
                item.classList.remove('stay-open');
            });
        }
    });
}




        // Modify your existing initializeNavigation function
function initializeNavigation() {
    if (isMobileDevice()) {
        handleMobileNavigation();
    } else {
        toggleDropdownIconOnHover(allDropdownItems);
        handleDesktopStickyClick(); 
    }
}

        // Closing and opening of the aside button
        function toggleOpenClose() {
            let fatoggle = true;
            closess.classList.replace('fa-times', 'fa-bars');
            aside.style.width = '30px';
            aside.style.minWidth = '20px';
            toggleLogo.style.flexDirection = 'column';
            toggleLogo.style.rowGap = '1.5rem';
            navigationAll.forEach((all) => {
                all.style.display = 'none';
            });

            closess.onclick = () => {
                fatoggle = !fatoggle;

                if (fatoggle === true) {
                    closess.classList.replace('fa-times', 'fa-bars');
                    aside.style.width = '30px';
                    aside.style.minWidth = '30px';
                    toggleLogo.style.flexDirection = 'column';
                    toggleLogo.style.rowGap = '1.5rem';
                    navigationAll.forEach((all) => {
                        all.style.display = 'none';
                    });
                } else {
                    closess.classList.replace('fa-bars', 'fa-times');
                    aside.style.width = '16%';
                    aside.style.minWidth = '160px';
                    toggleLogo.style.flexDirection = 'row';
                    navigationAll.forEach((all) => {
                        all.style.display = 'block';
                    });
                }
            };
        }

        // Handle window resize
        window.addEventListener('resize', function() {
            initializeNavigation();
        });

        // Initialize everything
        initializeNavigation();
        toggleOpenClose();
  
