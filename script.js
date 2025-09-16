//*// Navegação suave e menu mobile
document.addEventListener("DOMContentLoaded", () => {
  // Elementos do DOM
  const navToggle = document.querySelector(".nav-toggle")
  const navMenu = document.querySelector(".nav-menu")
  const navLinks = document.querySelectorAll(".nav-link")
  const header = document.querySelector(".header")
  const backToTop = document.getElementById("backToTop")
  const contactForm = document.getElementById("contactForm")
  const downloadCV = document.getElementById("downloadCV")
  const emailjs = window.emailjs // Declare the emailjs variable

  // Toggle do menu mobile
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active")
    navToggle.classList.toggle("active")
  })

  // Fechar menu ao clicar em um link
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active")
      navToggle.classList.remove("active")
    })
  })

  // Navegação ativa baseada no scroll
  function updateActiveNav() {
    const sections = document.querySelectorAll("section")
    const scrollPos = window.scrollY + 100

    sections.forEach((section) => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.offsetHeight
      const sectionId = section.getAttribute("id")
      const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`)

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach((link) => link.classList.remove("active"))
        if (navLink) navLink.classList.add("active")
      }
    })
  }

  // Header com efeito de scroll
  function handleScroll() {
    if (window.scrollY > 50) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
    }

    // Botão voltar ao topo
    if (window.scrollY > 300) {
      backToTop.classList.add("show")
    } else {
      backToTop.classList.remove("show")
    }

    updateActiveNav()
    animateOnScroll()
  }

  // Event listeners para scroll
  window.addEventListener("scroll", handleScroll)

  // Botão voltar ao topo
  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  })

  // Animações de entrada
  function animateOnScroll() {
    const elements = document.querySelectorAll(".fade-in, .slide-in-left, .slide-in-right")

    elements.forEach((element) => {
      const elementTop = element.getBoundingClientRect().top
      const elementVisible = 150

      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add("visible")
      }
    })
  }

  // Adicionar classes de animação aos elementos
  function addAnimationClasses() {
    // Seções principais
    document.querySelectorAll(".section-header").forEach((el) => {
      el.classList.add("fade-in")
    })

    // Cards de projeto
    document.querySelectorAll(".project-card").forEach((el, index) => {
      el.classList.add("fade-in")
      el.style.transitionDelay = `${index * 0.1}s`
    })

    // Skills
    document.querySelectorAll(".skill-item").forEach((el, index) => {
      el.classList.add("slide-in-right")
      el.style.transitionDelay = `${index * 0.1}s`
    })

    // Stats
    document.querySelectorAll(".stat-item").forEach((el, index) => {
      el.classList.add("fade-in")
      el.style.transitionDelay = `${index * 0.2}s`
    })

    // About text
    document.querySelector(".about-text")?.classList.add("slide-in-left")
    document.querySelector(".skills-container")?.classList.add("slide-in-right")

    // Contact info
    document.querySelector(".contact-info")?.classList.add("slide-in-left")
    document.querySelector(".contact-form")?.classList.add("slide-in-right")
  }

  // Animação das barras de skill
  function animateSkillBars() {
    const skillBars = document.querySelectorAll(".skill-progress")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const skillBar = entry.target
            const width = skillBar.getAttribute("data-width")
            skillBar.style.width = width
          }
        })
      },
      { threshold: 0.5 },
    )

    skillBars.forEach((bar) => observer.observe(bar))
  }

  // Formulário de contato
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault()

    const btn = this.querySelector('button[type="submit"]')

    // Initialize EmailJS with your public key
    emailjs.init("YOUR_PUBLIC_KEY") // You'll need to replace this with your actual EmailJS public key

    // Show loading state
    btn.classList.add("loading")
    btn.disabled = true

    // Send email using EmailJS - configured to send to cvdinizramos@gmail.com
    emailjs
      .sendForm("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", this)
      .then(
        (response) => {
          console.log("SUCCESS!", response.status, response.text)
          showNotification("Mensagem enviada com sucesso para cvdinizramos@gmail.com!", "success")
          contactForm.reset()
        },
        (error) => {
          console.log("FAILED...", error)
          showNotification("Erro ao enviar mensagem. Tente novamente.", "error")
        },
      )
      .finally(() => {
        btn.classList.remove("loading")
        btn.disabled = false
      })
  })

  // Download do currículo
  downloadCV.addEventListener("click", (e) => {
    e.preventDefault()

    const resumeUrl = "https://docs.google.com/document/d/1_3CIDasNcO2HzBqKouM5YM72md6QwJckOqqopUGbICg/edit?usp=sharing"
    window.open(resumeUrl, "_blank")

    showNotification("Abrindo currículo em nova aba!", "info")
  })

  // Sistema de notificações
  function showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `

    if (!document.querySelector("#notification-styles")) {
      const styles = document.createElement("style")
      styles.id = "notification-styles"
      styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    z-index: 10000;
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                    max-width: 350px;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification-content {
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .notification-success {
                    border-left: 4px solid #10b981;
                }
                .notification-info {
                    border-left: 4px solid #2563eb;
                }
                .notification-error {
                    border-left: 4px solid #ef4444;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #64748b;
                    margin-left: 1rem;
                }
            `
      document.head.appendChild(styles)
    }

    document.body.appendChild(notification)

    // Mostrar notificação
    setTimeout(() => notification.classList.add("show"), 100)

    // Fechar notificação
    const closeBtn = notification.querySelector(".notification-close")
    closeBtn.addEventListener("click", () => {
      notification.classList.remove("show")
      setTimeout(() => notification.remove(), 300)
    })

    // Auto fechar após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove("show")
        setTimeout(() => notification.remove(), 300)
      }
    }, 5000)
  }

  // Efeitos de hover nos cards de projeto
  function addProjectHoverEffects() {
    const projectCards = document.querySelectorAll(".project-card")

    projectCards.forEach((card) => {
      card.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-10px) scale(1.02)"
      })

      card.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0) scale(1)"
      })
    })
  }

  // Contador animado para estatísticas
  function animateCounters() {
    const counters = document.querySelectorAll(".stat-number")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const counter = entry.target
            const target = Number.parseInt(counter.textContent.replace("+", ""))
            let current = 0
            const increment = target / 50
            const timer = setInterval(() => {
              current += increment
              if (current >= target) {
                counter.textContent = target + "+"
                clearInterval(timer)
              } else {
                counter.textContent = Math.floor(current) + "+"
              }
            }, 30)

            observer.unobserve(counter)
          }
        })
      },
      { threshold: 0.5 },
    )

    counters.forEach((counter) => observer.observe(counter))
  }

  // Inicializar todas as funcionalidades
  function init() {
    addAnimationClasses()
    animateSkillBars()
    addProjectHoverEffects()
    animateCounters()
    handleScroll() // Executar uma vez para definir estado inicial
  }

  // Executar inicialização
  init()

  // Smooth scroll para links internos
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Preloader (opcional)
  window.addEventListener("load", () => {
    document.body.classList.add("loaded")

    // Adicionar classe loaded para animações iniciais
    setTimeout(() => {
      document.querySelectorAll(".hero-title, .hero-subtitle, .hero-description").forEach((el, index) => {
        setTimeout(() => {
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
        }, index * 200)
      })
    }, 500)
  })

  // Adicionar estilos para o preloader se necessário
  const preloaderStyles = `
        .hero-title, .hero-subtitle, .hero-description {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
    `

  const styleSheet = document.createElement("style")
  styleSheet.textContent = preloaderStyles
  document.head.appendChild(styleSheet)
})

// Função para detectar dispositivo móvel
function isMobile() {
  return window.innerWidth <= 768
}

// Otimizações para performance
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Aplicar debounce ao scroll para melhor performance
window.addEventListener(
  "scroll",
  debounce(() => {
    // Lógica de scroll otimizada
  }, 10),
)
