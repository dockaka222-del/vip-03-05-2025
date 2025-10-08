export function highlightActiveLink() {
  const links = document.querySelectorAll('.navbar-menu a');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && window.location.pathname.endsWith(href.replace('./', ''))) {
      link.classList.add('active');
    }
  });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function renderAlert(container, message, type = 'success') {
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}
