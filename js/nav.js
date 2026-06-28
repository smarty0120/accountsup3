(function () {
  var PAGES = {
    'index.html': 'nav-home',
    'services.html': 'nav-services',
    'about.html': 'nav-about',
    'performance.html': 'nav-performance',
    'consultation.html': 'nav-consultation',
    'contact.html': 'nav-contact'
  };

  function getCurrentPage() {
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    if (filename === '' || filename === '/') filename = 'index.html';
    return filename;
  }

  function setActiveNav() {
    var current = getCurrentPage();
    var activeId = PAGES[current];
    if (activeId) {
      var el = document.getElementById(activeId);
      if (el) el.classList.add('active');
      var mob = document.getElementById('mob-' + activeId);
      if (mob) mob.classList.add('active');
    }
  }

  function initHamburger() {
    var btn = document.getElementById('hamburger-btn');
    var menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      btn.classList.toggle('open');
      menu.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        btn.classList.remove('open');
        menu.classList.remove('open');
      }
    });
    var mobileLinks = menu.querySelectorAll('a');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function() {
        btn.classList.remove('open');
        menu.classList.remove('open');
      });
    });
  }

  function initStickyNav() {
    var nav = document.getElementById('main-nav');
    if (!nav) return;
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });
    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    
    reveals.forEach(function(el) {
      observer.observe(el);
    });
  }

  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var targetStr = el.getAttribute('data-count');
          var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
          var target = parseFloat(targetStr);
          var suffix = el.getAttribute('data-suffix') || '';
          
          if (isNaN(target)) {
            el.textContent = targetStr + suffix;
            observer.unobserve(el);
            return;
          }
          
          var start = 0;
          var duration = 1500;
          var stepTime = Math.abs(Math.floor(duration / Math.max(target, 1)));
          stepTime = Math.max(stepTime, 16);
          var increment = target / (duration / stepTime);
          
          var timer = setInterval(function() {
            start += increment;
            if (start >= target) {
              el.textContent = target.toFixed(decimals) + suffix;
              clearInterval(timer);
            } else {
              el.textContent = start.toFixed(decimals) + suffix;
            }
          }, stepTime);
          
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1 });
    
    counters.forEach(function(c) {
      observer.observe(c);
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function injectThemeToggle() {
    var navInner = document.querySelector('.nav-inner');
    if (!navInner) return;
    
    var navActions = navInner.querySelector('.nav-actions');
    if (!navActions) return;
    
    var toggleGroup = document.createElement('div');
    toggleGroup.style.cssText = 'display:flex;align-items:center;gap:10px;margin-left:16px;';
    
    var label = document.createElement('span');
    label.id = 'theme-label';
    label.style.cssText = 'font-size:12px;color:var(--slate-soft);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;';
    label.textContent = 'Dark';
    
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.innerHTML = '<div id="theme-toggle-knob"></div>';
    
    toggleGroup.appendChild(label);
    toggleGroup.appendChild(btn);
    navActions.parentNode.insertBefore(toggleGroup, navActions.nextSibling);
    
    var theme = localStorage.getItem('accountsup_theme') || 'dark';
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      label.textContent = 'Light';
    }
    
    btn.addEventListener('click', function() {
      var isLight = document.body.classList.toggle('light-theme');
      if (isLight) {
        localStorage.setItem('accountsup_theme', 'light');
        label.textContent = 'Light';
      } else {
        localStorage.setItem('accountsup_theme', 'dark');
        label.textContent = 'Dark';
      }
    });
  }

  function injectLogo() {
    var logos = document.querySelectorAll('.nav-logo');
    logos.forEach(function(el) {
      el.classList.add('nav-logo-badge');
      
      var img = document.createElement('img');
      img.className = 'logo-img';
      img.alt = 'Accountsup Logo';
      img.src = 'assets/logo.png';
      
      img.onerror = function() {
        this.style.display = 'none';
        el.textContent = 'ACCOUNTSUP';
        el.style.cssText += 'font-size:16px;font-weight:800;letter-spacing:0.05em;color:var(--gold);';
      };
      
      el.innerHTML = '';
      el.appendChild(img);
    });
  }

  function initAll() {
    injectLogo();
    setActiveNav();
    initHamburger();
    initStickyNav();
    initBackToTop();
    initScrollReveal();
    initCounters();
    initSmoothScroll();
    injectThemeToggle();

    var body = document.body;
    var clearAnimation = function (e) {
      if (!e || e.animationName === 'pageFadeIn') {
        body.classList.remove('page-fade-in');
        body.style.transform = '';
        body.removeEventListener('animationend', clearAnimation);
      }
    };
    body.addEventListener('animationend', clearAnimation);
    setTimeout(clearAnimation, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.AccountsupNav = {
    setActiveNav: setActiveNav,
    initCounters: initCounters
  };
})();
