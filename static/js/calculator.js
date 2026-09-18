// Данные по городам: аренда, продукты, коммуналка, транспорт, страховка, питание вне дома.
// Ориентиры на 2026 год, пересматривать раз в полгода.
var cityData = {
  barcelona:    { name: 'Барселона',     center1: 1550, outer1: 1075, center2: 2150, outer2: 1450, center3: 2750, groceries: 280, utilities: 115, transport: 23, insurance: 100, dining: [140, 170, 220] },
  madrid:       { name: 'Мадрид',        center1: 1450, outer1: 925,  center2: 1900, outer2: 1350, center3: 2400, groceries: 260, utilities: 100, transport: 33, insurance: 90,  dining: [120, 150, 200] },
  malaga:       { name: 'Малага',        center1: 1075, outer1: 825,  center2: 1450, outer2: 1100, center3: 1950, groceries: 240, utilities: 95,  transport: 32, insurance: 87,  dining: [110, 130, 170] },
  valencia:     { name: 'Валенсия',      center1: 975,  outer1: 725,  center2: 1300, outer2: 950,  center3: 1650, groceries: 225, utilities: 90,  transport: 37, insurance: 82,  dining: [105, 125, 160] },
  sevilla:      { name: 'Севилья',       center1: 875,  outer1: 625,  center2: 1175, outer2: 850,  center3: 1550, groceries: 215, utilities: 107, transport: 35, insurance: 80,  dining: [100, 115, 145] },
  alicante:     { name: 'Аликанте',      center1: 775,  outer1: 625,  center2: 1100, outer2: 800,  center3: 1450, groceries: 215, utilities: 87,  transport: 23, insurance: 77,  dining: [100, 115, 145] },
  granada:      { name: 'Гранада',       center1: 650,  outer1: 525,  center2: 950,  outer2: 700,  center3: 1300, groceries: 200, utilities: 85,  transport: 30, insurance: 75,  dining: [90, 110, 140] },
  murcia:       { name: 'Мурсия',        center1: 775,  outer1: 550,  center2: 1050, outer2: 750,  center3: 1400, groceries: 210, utilities: 88,  transport: 28, insurance: 75,  dining: [95, 115, 145] },
  marbella:     { name: 'Марбелья',      center1: 1450, outer1: 1100, center2: 2000, outer2: 1500, center3: 2550, groceries: 290, utilities: 95,  transport: 70, insurance: 100, dining: [150, 190, 250] },
  sanSebastian: { name: 'Сан-Себастьян', center1: 1350, outer1: 900,  center2: 1850, outer2: 1300, center3: 2400, groceries: 300, utilities: 120, transport: 35, insurance: 95,  dining: [160, 200, 270] },
};

var visaRequirements = {
  digital:      'Digital Nomad — от 2 849 € в месяц, +75% SMI на супруга',
  nonlucrative: 'Non Lucrativa — от 2 400 € в месяц пассивного дохода',
  student:      'Студенческий ВНЖ — от 600 € в месяц',
  startup:      'StartUp — бизнес-план и одобрение ENISA',
  work:         'ВНЖ по трудовому договору — зарплата по контракту',
};

function $(id) { return document.getElementById(id); }
function eur(n) { return '€' + Math.round(n).toLocaleString('ru-RU'); }

function getRent(data) {
  var map = { center: 'center1', outer: 'outer1', center2: 'center2', outer2: 'outer2', center3: 'center3' };
  return data[map[$('apartmentType').value] || 'center1'];
}

function calculate() {
  var data = cityData[$('city').value];
  var familySize = Math.max(1, parseInt($('familySize').value, 10) || 1);
  var rent = getRent(data);
  var diningLevel = parseInt($('diningOut').value, 10);

  // ── Стартовые расходы ──
  var docs = 163; // госпошлина
  if ($('translations').checked) docs += 450 * familySize; // апостили + присяжные переводы
  if ($('lawyerServices').checked) docs += 1200;
  if ($('insurance').checked) docs += 1050 * familySize;

  var housingStart = $('rentDeposit').checked ? rent * 3 : rent; // 2 месяца залог + первый месяц

  var moving = 300;
  if ($('flights').checked) moving += 250 * familySize;
  if ($('furniture').checked) moving += 1750;
  if ($('moving').checked) moving += 4000;

  var startupTotal = docs + housingStart + moving;

  // ── Ежемесячные расходы ──
  // Каждый следующий член семьи добавляет 60% к базовой корзине, а не 100%
  var groceries = familySize === 1 ? data.groceries : Math.round(data.groceries * (1 + (familySize - 1) * 0.6));
  var utilities = familySize === 1 ? data.utilities : Math.round(data.utilities * 1.3);
  var transport = data.transport * Math.min(familySize, 2) + ($('hasCar').checked ? 450 : 0);
  var insuranceMonthly = data.insurance * familySize;
  var dining = data.dining[diningLevel] * familySize;

  var kidsCount = Math.max(0, parseInt($('kidsCount').value, 10) || 0);
  var extras = 120 * familySize;
  extras += kidsCount * 450; // школа, кружки, лагеря — реальный ориентир 400-500 € на ребёнка
  if ($('gym').checked) extras += 40 * familySize;

  var monthlyTotal = rent + groceries + utilities + transport + insuranceMonthly + dining + extras;

  // ── Вывод ──
  $('summaryCity').textContent = data.name;
  $('summaryPeople').textContent = familySize + (kidsCount ? ', из них детей: ' + kidsCount : '');
  $('visaRequirement').textContent = visaRequirements[$('visaType').value];

  $('docsTotal').textContent = eur(docs);
  $('housingStart').textContent = eur(housingStart);
  $('movingTotal').textContent = eur(moving);
  $('startupTotal').textContent = eur(startupTotal);

  $('rentMonthly').textContent = eur(rent);
  $('groceriesMonthly').textContent = eur(groceries);
  $('utilitiesMonthly').textContent = eur(utilities);
  $('transportMonthly').textContent = eur(transport);
  $('insuranceMonthly').textContent = eur(insuranceMonthly);
  $('diningMonthly').textContent = eur(dining);
  $('extrasMonthly').textContent = eur(extras);
  $('monthlyTotal').textContent = eur(monthlyTotal);

  $('firstYearTotal').textContent = eur(startupTotal + monthlyTotal * 12);
  $('sixMonthsTotal').textContent = eur(startupTotal + monthlyTotal * 6);

  // Проверка: хватает ли дохода на выбранную программу
  var thresholds = { digital: 2849, nonlucrative: 2400, student: 600, startup: 0, work: 0 };
  var need = thresholds[$('visaType').value];
  var verdict = $('verdict');
  if (need && monthlyTotal > need) {
    verdict.innerHTML =
      '<strong>Обратите внимание:</strong> ваши расходы (' + eur(monthlyTotal) +
      ') выше минимального порога дохода по программе (' + eur(need) +
      '). Порог — это требование миграционной службы, а не сумма, на которую реально жить. Планируйте доход с запасом.';
    verdict.style.display = 'block';
  } else if (need) {
    verdict.innerHTML =
      'Ваши расходы (' + eur(monthlyTotal) + ') укладываются в порог дохода по программе (' + eur(need) + ').';
    verdict.style.display = 'block';
  } else {
    verdict.style.display = 'none';
  }
}

document.querySelectorAll('#calc input, #calc select').forEach(function (el) {
  el.addEventListener('input', calculate);
  el.addEventListener('change', calculate);
});

calculate();

// Переносим результат расчёта в комментарий заявки — Алина сразу видит цифры
var calcForm = document.querySelector('#calc-lead .lead-form');
if (calcForm) {
  calcForm.addEventListener('submit', function () {
    var field = calcForm.querySelector('[name="comment"]');
    var summary =
      'Расчёт из калькулятора: ' + $('summaryCity').textContent +
      ', человек: ' + $('summaryPeople').textContent +
      ', старт ' + $('startupTotal').textContent +
      ', в месяц ' + $('monthlyTotal').textContent +
      ', первый год ' + $('firstYearTotal').textContent +
      '. Программа: ' + $('visaType').options[$('visaType').selectedIndex].text;
    if (field) field.value = field.value ? field.value + '\n\n' + summary : summary;
  }, true);
}
