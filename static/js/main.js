// ═══ Движение ═══
// Правило, из-за которого этот файл переписан: содержимое видно всегда.
// Раньше блоки и слова заголовков стартовали с opacity: 0 и показывались
// только по срабатыванию наблюдателя. Если он не срабатывал — фоновая вкладка,
// старый браузер, снимок страницы, сбой скрипта — секция оставалась пустой.
// Теперь появление двигает только смещение: без JS текст просто стоит на месте.

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Ступенчатое появление внутри сеток ──
// Идёт ПЕРЕД наблюдателем: здесь детям проставляется data-reveal, а наблюдатель
// ниже собирает элементы уже по этому атрибуту.
(function () {
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var step = parseInt(group.getAttribute('data-stagger'), 10) || 90;
    Array.prototype.forEach.call(group.children, function (child, i) {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', '');
      child.style.setProperty('--reveal-delay', i * step + 'ms');
    });
  });
})();

// ── Появление блоков при прокрутке ──
(function () {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('revealed'); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
  );

  items.forEach(function (el) { observer.observe(el); });

  // Страховка: что бы ни случилось с наблюдателем, через две секунды
  // всё встаёт на свои места.
  setTimeout(function () { items.forEach(function (el) { el.classList.add('revealed'); }); }, 2000);
})();

// ── Шапка уезжает при прокрутке вниз и возвращается при прокрутке вверх ──
// Просто прятать её нельзя: вся навигация сидит за бургером, и без возврата
// наверх пользователь остался бы без меню посреди страницы.
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var lastY = window.scrollY;
  var ticking = false;

  function update() {
    var y = window.scrollY;
    var open = document.querySelector('.nav-overlay.open');

    if (open || y <= 90) {
      header.classList.remove('is-hidden');
    } else if (y > lastY) {
      header.classList.add('is-hidden');
    } else if (lastY - y > 12) {
      header.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
})();

// ═══ Интерфейс ═══

// ── FAQ ──
// Раскрывается через grid-template-rows, поэтому высота анимируется честно,
// а ответ доступен с клавиатуры и остаётся в разметке для поиска.
document.querySelectorAll('.faq-q').forEach(function (btn) {
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', function () {
    var item = btn.closest('.faq-item');
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function (el) {
      el.classList.remove('open');
      var q = el.querySelector('.faq-q');
      if (q) q.setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// ── Меню на весь экран ──
var navToggle = document.querySelector('.nav-toggle');
var nav = document.getElementById('nav');
if (navToggle && nav) {
  var navHeader = document.querySelector('.site-header');

  var setNav = function (open) {
    nav.classList.toggle('open', open);
    nav.setAttribute('aria-hidden', open ? 'false' : 'true');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    // Шапка лежит выше оверлея: пока меню открыто, её заливка убирается,
    // иначе полоса перекрывает верх меню.
    if (navHeader) navHeader.classList.toggle('over-nav', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  navToggle.addEventListener('click', function () {
    setNav(!nav.classList.contains('open'));
  });

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setNav(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setNav(false);
      navToggle.focus();
    }
  });
}

// ── Отправка заявок ──
document.querySelectorAll('.lead-form').forEach(function (form) {
  var pageField = form.querySelector('input[name="page"]');
  if (pageField) pageField.value = location.pathname;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var errorBox = form.querySelector('.form-error');
    var contact = form.querySelector('[name="contact"]');
    errorBox.classList.remove('show');

    if (!contact.value || contact.value.trim().length < 3) {
      errorBox.textContent = 'Укажите, куда вам написать: Telegram, WhatsApp или почту';
      errorBox.classList.add('show');
      contact.focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Отправляю…';

    try {
      // На своём сервере это /lead. В статике на Pages сервера нет:
      // адрес внешнего приёмника кладётся в <body data-lead-endpoint>.
      var endpoint = document.body.getAttribute('data-lead-endpoint') || '/lead';
      var res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      var data = await res.json();

      if (!data.ok) throw new Error(data.error || 'Не удалось отправить');

      var ok = document.getElementById(form.id + '-ok');
      form.style.display = 'none';
      ok.classList.add('show');

      // Ссылку на материал возвращает сервер, а в статике она заранее
      // напечатана в самой форме.
      var download = data.download || form.getAttribute('data-download');
      if (download) {
        var slot = ok.querySelector('.download-slot');
        slot.innerHTML =
          '<p style="margin-top:24px"><a class="btn" href="' + download + '">Скачать материал</a></p>';
        setTimeout(function () { window.location.href = download; }, 900);
      }

      ok.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    } catch (err) {
      errorBox.textContent = err.message + '. Попробуйте ещё раз или напишите в Telegram.';
      errorBox.classList.add('show');
      btn.disabled = false;
      btn.textContent = label;
    }
  });
});

// ── Полоса хода работы ──
// Линия слева заполняется по мере прохождения блока, шаг в середине экрана
// подсвечивается. Считается от середины окна, а не от края: иначе последний
// шаг «догорает» уже за пределами видимости.
(function () {
  var box = document.querySelector('.steps');
  if (!box) return;

  var steps = Array.prototype.slice.call(box.querySelectorAll('.step'));

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle('is-current', e.isIntersecting); });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    steps.forEach(function (s) { io.observe(s); });
  }

  if (reduceMotion) return;

  var fill = document.createElement('div');
  fill.className = 'steps-fill';
  box.appendChild(fill);

  var ticking = false;

  function draw() {
    var r = box.getBoundingClientRect();
    var line = window.innerHeight * 0.55;
    var p = (line - r.top) / r.height;
    p = Math.min(1, Math.max(0, p));
    fill.style.height = p * (box.clientHeight - 12) + 'px';
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(draw);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  draw();
})();

// ── Параллакс на фотографиях ──
// Картинка едет медленнее страницы. Сдвиг считается от центра прохода,
// поэтому в середине экрана кадр стоит ровно так, как он свёрстан.
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('.pxframe'));
  if (!frames.length || reduceMotion) return;

  var ticking = false;

  function frame() {
    var vh = window.innerHeight;

    frames.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;

      var p = (vh - r.top) / (vh + r.height);
      p = Math.min(1, Math.max(0, p));

      // Картинка увеличена на 10%, значит запас — по 5% высоты сверху и снизу.
      var travel = parseFloat(el.getAttribute('data-parallax')) || 34;
      travel = Math.min(travel, r.height * 0.09);
      var img = el.querySelector('img');
      if (img) img.style.setProperty('--py', ((p - 0.5) * travel).toFixed(1) + 'px');
    });
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();
