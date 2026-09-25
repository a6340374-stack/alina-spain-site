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

// ── Шапка ───────────────────────────────────────────────────────────────
// Она закреплена и при прокрутке не уезжает: на широком экране разделы
// стоят строкой и должны оставаться под рукой на любой высоте страницы.

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
// Заявка — единственная цель сайта, поэтому она не должна теряться ни при
// каких сбоях. Если приёмник не ответил, человек не видит техническую
// ошибку: форма собирает текст заявки и предлагает отправить его в мессенджер.

// Контакт должен быть похож на то, по чему реально можно написать:
// почта, телефон (7–15 цифр), ник или ссылка в Telegram. «abc» не проходит.
function isReachableContact(value) {
  var v = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
  var digits = v.replace(/\D/g, '');
  if (/^\+?[\d\s().-]+$/.test(v) && digits.length >= 7 && digits.length <= 15) return true;
  if (/^(https?:\/\/)?(t\.me|telegram\.me)\/[A-Za-z0-9_]{4,32}\/?$/i.test(v)) return true;
  if (/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v)) return true;
  return false;
}

var LEAD_LABELS = {
  name: 'Имя', contact: 'Контакт', location: 'Где сейчас', family: 'Кто едет',
  income_source: 'Источник дохода', income_range: 'Доход в месяц', comment: 'Комментарий',
};

function leadText(form) {
  var fd = new FormData(form);
  var lines = ['Здравствуйте, Алина! Хочу записаться на разбор.'];
  Object.keys(LEAD_LABELS).forEach(function (key) {
    var val = (fd.get(key) || '').toString().trim();
    if (val) lines.push(LEAD_LABELS[key] + ': ' + val);
  });
  return lines.join('\n');
}

document.querySelectorAll('.lead-form').forEach(function (form) {
  var pageField = form.querySelector('input[name="page"]');
  if (pageField) pageField.value = location.pathname;

  var errorBox = form.querySelector('.form-error');
  var contact = form.querySelector('[name="contact"]');
  var fallback = form.querySelector('.form-fallback');

  function showError(message, invalidField) {
    errorBox.textContent = message;
    errorBox.classList.add('show');
    if (invalidField) {
      invalidField.setAttribute('aria-invalid', 'true');
      invalidField.focus();
    }
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.remove('show');
    contact.removeAttribute('aria-invalid');
    if (fallback) fallback.hidden = true;
  }

  var fallbackLead = fallback ? fallback.querySelector('.form-fallback-lead') : null;
  var fallbackLeadDefault = fallbackLead ? fallbackLead.textContent : '';

  // message — текст ошибки; без него панель показывается как обычный шаг,
  // а не как сбой (статика без приёмника: заявка сразу уходит в мессенджер)
  function showFallback(message) {
    if (message) showError(message);
    if (!fallback) return;
    if (fallbackLead) {
      fallbackLead.textContent = message
        ? fallbackLeadDefault
        : 'Заявку Алина примет в Telegram. Текст уже собран из формы, осталось нажать кнопку и отправить:';
    }
    var text = leadText(form);
    var box = fallback.querySelector('.form-fallback-text');
    box.value = text;
    var tg = fallback.querySelector('[data-fallback="telegram"]');
    if (tg) tg.href = tg.href.split('?')[0] + '?text=' + encodeURIComponent(text);
    var wa = fallback.querySelector('[data-fallback="whatsapp"]');
    if (wa) wa.href = wa.href.split('?')[0] + '?text=' + encodeURIComponent(text);
    fallback.hidden = false;
  }

  contact.addEventListener('input', function () {
    if (contact.getAttribute('aria-invalid')) clearError();
  });

  if (fallback) {
    var copyBtn = fallback.querySelector('.form-fallback-copy');
    var box = fallback.querySelector('.form-fallback-text');
    var copyText = function () {
      var done = function () { copyBtn.textContent = 'Скопировано'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(box.value).then(done, function () { box.select(); });
      }
      box.select();
    };
    copyBtn.addEventListener('click', copyText);
    // Не все приложения Telegram подставляют текст из ссылки, поэтому
    // при переходе он заодно копируется: останется вставить и отправить.
    fallback.querySelectorAll('[data-fallback]').forEach(function (link) {
      link.addEventListener('click', function () { copyText(); });
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearError();

    if (!contact.value.trim()) {
      showError('Укажите, куда вам написать: Telegram, WhatsApp или почту.', contact);
      return;
    }
    if (!isReachableContact(contact.value)) {
      showError('Не получается распознать контакт. Напишите ник в Telegram (@username), номер телефона с кодом страны или почту.', contact);
      return;
    }

    if (document.body.getAttribute('data-lead-mode') === 'messenger') {
      // Форма ради материала: человек пришёл за файлом — отдаём файл.
      // «Заявка отправлена» тут не показываем: никуда она не ушла.
      var dl = form.getAttribute('data-download');
      if (dl) {
        window.location.href = dl;
        return;
      }
      showFallback();
      var first = fallback && fallback.querySelector('[data-fallback]');
      if (first) first.focus();
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Отправляю…';
    form.setAttribute('aria-busy', 'true');

    var restore = function () {
      btn.disabled = false;
      btn.textContent = label;
      form.removeAttribute('aria-busy');
    };

    // На своём сервере это /lead. В статике на Pages сервера нет:
    // адрес внешнего приёмника кладётся в <body data-lead-endpoint>.
    var endpoint = document.body.getAttribute('data-lead-endpoint') || '/lead';
    var controller = 'AbortController' in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;
    var res = null;
    var data = null;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
        signal: controller ? controller.signal : undefined,
      });
      // Ответ может прийти не JSON-ом (страница ошибки хостинга) — это тоже сбой
      data = await res.json().catch(function () { return null; });
    } catch (err) {
      res = null;
    }
    if (timer) clearTimeout(timer);

    if (!res || !data || !data.ok) {
      restore();
      if (res && res.status === 400 && data && /контакт/i.test(data.error || '')) {
        showError('Не получается распознать контакт. Напишите ник в Telegram (@username), номер телефона с кодом страны или почту.', contact);
      } else if (res && res.status === 429) {
        showFallback('Слишком много попыток подряд. Подождите пару минут или отправьте заявку в мессенджер.');
      } else {
        showFallback('Заявка не ушла: сайт не получил ответа. Всё, что вы ввели, сохранено. Можно нажать кнопку ещё раз или отправить заявку в мессенджер.');
      }
      return;
    }

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
    // Фокус на подтверждение: экранная читалка объявит, что заявка ушла
    var okTitle = ok.querySelector('h3');
    if (okTitle) okTitle.focus({ preventScroll: true });
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

// ── Кнопка-хвост ────────────────────────────────────────────────────────────
// Показываем, когда основная кнопка первого экрана ушла вверх, и убираем,
// когда на экране появилась сама форма: две одинаковые кнопки рядом мешают.
// У подвала тоже убираем: там кнопка ложится поверх ссылок и имени.
(function () {
  var dock = document.getElementById('cta-dock');
  if (!dock) return;

  var topActions = document.querySelector('.cover-actions');
  var form = document.getElementById('zayavka') || document.querySelector('.form-card');
  var footer = document.querySelector('.site-footer');
  var pastTop = false;
  var formVisible = false;
  var footerVisible = false;

  function apply() {
    dock.hidden = false;
    dock.classList.toggle('is-on', pastTop && !formVisible && !footerVisible);
  }

  if ('IntersectionObserver' in window) {
    if (topActions) {
      new IntersectionObserver(function (e) {
        pastTop = !e[0].isIntersecting;
        apply();
      }, { rootMargin: '-80px 0px 0px 0px' }).observe(topActions);
    } else {
      pastTop = true;
    }
    if (form) {
      new IntersectionObserver(function (e) {
        formVisible = e[0].isIntersecting;
        apply();
      }, { rootMargin: '0px 0px -10% 0px' }).observe(form);
    }
    if (footer) {
      new IntersectionObserver(function (e) {
        footerVisible = e[0].isIntersecting;
        apply();
      }).observe(footer);
    }
    apply();
  } else {
    // без наблюдателя просто показываем: кнопка важнее анимации появления
    dock.hidden = false;
    dock.classList.add('is-on');
  }
})();
