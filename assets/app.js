document.addEventListener('DOMContentLoaded', function () {
  var BASE = "/schoolgames";
  var q = document.getElementById('q');
  var results = document.getElementById('results');
  var pageEl = document.getElementById('page');
  var index = null;
  var loading = false;

  function render(term) {
    if (!term) {
      results.hidden = true;
      pageEl.hidden = false;
      return;
    }
    pageEl.hidden = true;
    results.hidden = false;

    if (!index) {
      results.innerHTML = '<p class="empty">Loading search...</p>';
      return;
    }

    var t = term.toLowerCase();
    var hits = [];
    for (var i = 0; i < index.length && hits.length < 200; i++) {
      if (index[i][1].toLowerCase().indexOf(t) > -1) hits.push(index[i]);
    }

    if (!hits.length) {
      results.innerHTML = '<p class="empty">Nothing matches "' + term.replace(/[<>&]/g, '') + '".</p>';
      return;
    }

    var html = '<div class="section-head"><h2>Search</h2><span class="count">' + hits.length + (hits.length === 200 ? '+' : '') + '</span></div><ul class="hits">';
    for (var j = 0; j < hits.length; j++) {
      html += '<li><a href="' + BASE + '/g/' + hits[j][0] + '/"><span class="hit-name"></span><span class="hit-cat">' + hits[j][2] + '</span></a></li>';
    }
    results.innerHTML = html + '</ul>';
    // Titles go in as text, never as markup.
    var names = results.querySelectorAll('.hit-name');
    for (var k = 0; k < names.length; k++) names[k].textContent = hits[k][1];
  }

  function load() {
    if (index || loading) return;
    loading = true;
    fetch(BASE + '/search.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; render(q.value.trim()); })
      .catch(function () { results.innerHTML = '<p class="empty">Search is unavailable.</p>'; });
  }

  if (q && results && pageEl) {
    q.addEventListener('input', function () {
      var term = q.value.trim();
      if (term) load();
      render(term);
    });
  }

  var stage = document.getElementById('stage');
  var poster = document.getElementById('poster');
  if (stage && poster) {
    poster.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = stage.dataset.src;
      f.title = stage.dataset.title;
      f.allow = 'autoplay; fullscreen; gamepad; clipboard-write';
      f.setAttribute('allowfullscreen', '');
      stage.appendChild(f);
      poster.remove();
    });
  }

  var fs = document.getElementById('fs');
  if (fs && stage) {
    fs.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen();
    });
  }
});
