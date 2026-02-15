/* ============================================
   Novel Progress Manager - Application Logic
   ============================================ */

(function () {
  "use strict";

  // ---- Utility ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  }

  function formatNumber(n) {
    return n != null ? n.toLocaleString("ja-JP") : "0";
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  // ---- Storage ----
  const STORAGE_KEY = "novel_progress_projects";

  function loadProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  // ---- Mascot Characters ----
  const CHARACTER_KEY = "novel_progress_character";

  const CHARACTERS = {
    cat: {
      name: "ねこ",
      icon: '<svg viewBox="0 0 64 64"><polygon points="13,24 20,5 28,24" fill="#f5c56c"/><polygon points="36,24 44,5 51,24" fill="#f5c56c"/><polygon points="16,24 20,11 25,24" fill="#ffb6c1"/><polygon points="39,24 44,11 49,24" fill="#ffb6c1"/><circle cx="32" cy="38" r="21" fill="#f5c56c"/><ellipse cx="24" cy="34" rx="2.8" ry="3.2" fill="#2c2c2c"/><ellipse cx="40" cy="34" rx="2.8" ry="3.2" fill="#2c2c2c"/><circle cx="22.5" cy="33" r="1" fill="#fff"/><circle cx="38.5" cy="33" r="1" fill="#fff"/><ellipse cx="32" cy="40" rx="2.5" ry="2" fill="#ffb6c1"/><path d="M29,43 Q32,47 35,43" fill="none" stroke="#2c2c2c" stroke-width="1.2" stroke-linecap="round"/><line x1="7" y1="36" x2="19" y2="38" stroke="#d4a84a" stroke-width="1" stroke-linecap="round"/><line x1="7" y1="42" x2="19" y2="41" stroke="#d4a84a" stroke-width="1" stroke-linecap="round"/><line x1="45" y1="38" x2="57" y2="36" stroke="#d4a84a" stroke-width="1" stroke-linecap="round"/><line x1="45" y1="41" x2="57" y2="42" stroke="#d4a84a" stroke-width="1" stroke-linecap="round"/></svg>',
      messages: [
        "にゃ〜、今日も頑張ってるにゃ！えらいにゃ〜",
        "ゴロゴロ…書き進めてて偉いにゃ。ご褒美にお昼寝はどうにゃ？",
        "にゃんとも素晴らしい進捗にゃ！",
        "焦らなくていいにゃ〜。ねこだって気まぐれにゃ",
        "今日も一文字でも書けば、それは前進にゃ！",
        "にゃ〜、あなたの物語、楽しみにしてるにゃ",
        "ゴロゴロ…いいペースにゃ。このまま続けるにゃ〜",
        "にゃんだかいい感じにゃ！その調子にゃ！",
        "にゃふぅ…あなたが書いてる横で丸くなってるにゃ",
        "一緒にいるだけで安心するにゃ。頑張ってにゃ〜",
      ],
    },
    dog: {
      name: "いぬ",
      icon: '<svg viewBox="0 0 64 64"><ellipse cx="13" cy="28" rx="9" ry="15" fill="#c8875a" transform="rotate(-15,13,28)"/><ellipse cx="51" cy="28" rx="9" ry="15" fill="#c8875a" transform="rotate(15,51,28)"/><circle cx="32" cy="36" r="21" fill="#e8a86c"/><circle cx="24" cy="32" r="5" fill="#fff"/><circle cx="40" cy="32" r="5" fill="#fff"/><circle cx="25.5" cy="32" r="3" fill="#2c2c2c"/><circle cx="41.5" cy="32" r="3" fill="#2c2c2c"/><circle cx="24" cy="31" r="1" fill="#fff"/><circle cx="40" cy="31" r="1" fill="#fff"/><ellipse cx="32" cy="40" rx="4" ry="3" fill="#2c2c2c"/><path d="M28,44 Q32,49 36,44" fill="none" stroke="#2c2c2c" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="32" cy="50" rx="3.5" ry="4" fill="#ff8fa0"/></svg>',
      messages: [
        "ワンワン！今日も頑張ってるね！すごいすごい！",
        "しっぽブンブン！あなたの執筆、応援してるワン！",
        "やったー！書いてるだけで偉いワン！大好き！",
        "散歩のあとの執筆は最高だワン！がんばれー！",
        "ワン！毎日コツコツ、それが一番だワン！",
        "嬉しいワン！あなたが書いてくれて嬉しいワン！",
        "今日もいい調子だワン！ご褒美にナデナデ？",
        "ワンワン！最高の作品になるって信じてるワン！",
        "おかえり！待ってたワン！一緒に頑張るワン！",
        "どんな時もそばにいるワン！ファイトだワン！",
      ],
    },
    butler: {
      name: "執事",
      icon: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="24" rx="22" ry="14" fill="#3a3a3a"/><rect x="14" y="14" width="36" height="10" rx="3" fill="#3a3a3a"/><circle cx="32" cy="36" r="19" fill="#f5dcc0"/><circle cx="42" cy="33" r="6" fill="none" stroke="#c8a84e" stroke-width="1.5"/><line x1="47" y1="36" x2="52" y2="44" stroke="#c8a84e" stroke-width="1" stroke-linecap="round"/><circle cx="24" cy="33" r="2" fill="#2c2c2c"/><circle cx="42" cy="33" r="1.8" fill="#2c2c2c"/><line x1="20" y1="28" x2="28" y2="29.5" stroke="#3a3a3a" stroke-width="1.8" stroke-linecap="round"/><line x1="38" y1="29.5" x2="46" y2="28" stroke="#3a3a3a" stroke-width="1.8" stroke-linecap="round"/><path d="M25,43 Q28,41 32,43 Q36,41 39,43" fill="none" stroke="#3a3a3a" stroke-width="1.5" stroke-linecap="round"/><polygon points="27,56 32,52 37,56 32,54" fill="#c9302c"/></svg>',
      messages: [
        "お疲れ様でございます。本日もご執筆、感服いたします",
        "お見事でございます。着実に進んでおりますね",
        "ご主人様、お茶をお持ちしましょうか。休憩も大切でございます",
        "素晴らしいペースでございます。このまま参りましょう",
        "一行一行が、傑作への道でございます",
        "ご主人様のお力添えができて光栄でございます",
        "本日の進捗、大変よろしいかと存じます",
        "無理はなさらず。名作は焦らず生まれるものでございます",
        "お言葉ですが、そろそろお食事の時間でございます",
        "ご主人様の才能を信じております。引き続き、お仕えいたします",
      ],
    },
    secretary: {
      name: "秘書",
      icon: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="22" rx="23" ry="14" fill="#5a3825"/><rect x="11" y="22" width="42" height="5" rx="2" fill="#5a3825"/><circle cx="32" cy="36" r="19" fill="#f5dcc0"/><rect x="18" y="30" width="11" height="8" rx="3" fill="none" stroke="#5b6abf" stroke-width="1.5"/><rect x="35" y="30" width="11" height="8" rx="3" fill="none" stroke="#5b6abf" stroke-width="1.5"/><line x1="29" y1="34" x2="35" y2="34" stroke="#5b6abf" stroke-width="1.2"/><circle cx="23.5" cy="34" r="1.8" fill="#2c2c2c"/><circle cx="40.5" cy="34" r="1.8" fill="#2c2c2c"/><path d="M28,44 Q32,47 36,44" fill="none" stroke="#e67e5a" stroke-width="1.5" stroke-linecap="round"/><circle cx="18" cy="41" r="3.5" fill="#ffcdd2" opacity="0.4"/><circle cx="46" cy="41" r="3.5" fill="#ffcdd2" opacity="0.4"/></svg>',
      messages: [
        "お疲れ様です。今日のスケジュール、順調に進んでいますよ",
        "いい調子ですね。この勢いで行きましょう！",
        "進捗状況を確認しました。着実に前進しています",
        "少し休憩を入れましょうか？リフレッシュも大事ですよ",
        "素晴らしい集中力ですね。さすがです",
        "今日の目標達成まであと少し。頑張りましょう！",
        "振り返ると、かなり成長していますよ。自信を持って！",
        "予定通りの進行です。完璧ですね",
        "スケジュール管理はお任せください。あなたは書くことに集中して",
        "あなたの頑張り、ちゃんと記録しておきますね",
      ],
    },
    robot: {
      name: "ロボ",
      icon: '<svg viewBox="0 0 64 64"><line x1="32" y1="8" x2="32" y2="16" stroke="#90a4ae" stroke-width="2.5"/><circle cx="32" cy="6" r="3.5" fill="#4caf7d"/><rect x="11" y="16" width="42" height="38" rx="7" fill="#b0bec5"/><rect x="15" y="20" width="34" height="30" rx="5" fill="#cfd8dc"/><rect x="19" y="26" width="10" height="8" rx="2" fill="#263238"/><rect x="35" y="26" width="10" height="8" rx="2" fill="#263238"/><rect x="22" y="28" width="4" height="4" rx="1" fill="#4caf7d"/><rect x="38" y="28" width="4" height="4" rx="1" fill="#4caf7d"/><rect x="22" y="40" width="20" height="6" rx="2" fill="#263238"/><line x1="26" y1="40" x2="26" y2="46" stroke="#cfd8dc" stroke-width="1"/><line x1="30" y1="40" x2="30" y2="46" stroke="#cfd8dc" stroke-width="1"/><line x1="34" y1="40" x2="34" y2="46" stroke="#cfd8dc" stroke-width="1"/><line x1="38" y1="40" x2="38" y2="46" stroke="#cfd8dc" stroke-width="1"/><circle cx="9" cy="35" r="3.5" fill="#90a4ae"/><circle cx="55" cy="35" r="3.5" fill="#90a4ae"/></svg>',
      messages: [
        "解析完了。あなたの執筆活動ハ順調デス。継続ヲ推奨シマス",
        "データベース更新。進捗率、良好ト判定シマシタ",
        "アドバイス：適度ナ休息ハ生産性ヲ向上サセマス",
        "観測結果：アナタノ創造力レベルハ高イ状態デス",
        "計算中...完成予測ハ良好デス。コノ調子ヲ維持シテクダサイ",
        "エラーナシ。スベテ順調ニ進行中デス",
        "分析結果：一日一歩ノ積ミ重ネガ最モ効率的デス",
        "レポート：アナタノ物語ハ素晴ラシイデータヲ示シテイマス",
        "モチベーション値、正常範囲デス。ソノママ続ケテクダサイ",
        "バックアップ完了。アナタノ努力ハ記録サレテイマス",
      ],
    },
    mob: {
      name: "モブ",
      icon: '<svg viewBox="0 0 64 64"><circle cx="32" cy="28" r="22" fill="#a1887f"/><circle cx="32" cy="36" r="19" fill="#f5dcc0"/><path d="M14,30 Q22,14 32,12 Q42,14 50,30" fill="#a1887f"/><circle cx="24" cy="34" r="2" fill="#2c2c2c"/><circle cx="40" cy="34" r="2" fill="#2c2c2c"/><path d="M28,43 Q32,46 36,43" fill="none" stroke="#2c2c2c" stroke-width="1.2" stroke-linecap="round"/></svg>',
      messages: [
        "おっ、今日も書いてるんだ。頑張ってるね〜",
        "いいじゃんいいじゃん！その調子！",
        "あ、すごい。ちゃんと続けてるんだね",
        "まあ、無理しないでね。マイペースが一番だよ",
        "おお〜進んでるじゃん！いい感じ！",
        "書くって大変だよね。でも続けてるのえらい",
        "完成したら読ませてよ〜。楽しみにしてる",
        "なんか、応援してるよ。うん、頑張って",
        "あ、ども。今日もお疲れ〜",
        "地味にすごいと思う。いや、ほんとに",
      ],
    },
  };

  const CHARACTER_ORDER = ["cat", "dog", "butler", "secretary", "robot", "mob"];

  function loadCharacter() {
    return localStorage.getItem(CHARACTER_KEY) || "cat";
  }

  function saveCharacter(id) {
    localStorage.setItem(CHARACTER_KEY, id);
  }

  // ---- State ----
  let projects = loadProjects();
  let currentProjectId = null;
  let editingProjectId = null;
  let editingPlotId = null;
  let confirmCallback = null;
  let selectedCharacter = loadCharacter();

  // ---- DOM Elements ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const headerTitle = $("#headerTitle");
  const newProjectBtn = $("#newProjectBtn");

  const projectListView = $("#projectListView");
  const emptyState = $("#emptyState");
  const projectGrid = $("#projectGrid");

  const projectDetailView = $("#projectDetailView");
  const backBtn = $("#backBtn");
  const editProjectBtn = $("#editProjectBtn");
  const deleteProjectBtn = $("#deleteProjectBtn");
  const detailInfo = $("#detailInfo");

  const wordCountSection = $("#wordCountSection");
  const currentWordCountInput = $("#currentWordCount");
  const updateWordCountBtn = $("#updateWordCountBtn");
  const wordCountProgress = $("#wordCountProgress");
  const wordCountHistory = $("#wordCountHistory");

  const plotSection = $("#plotSection");
  const addPlotBtn = $("#addPlotBtn");
  const plotProgress = $("#plotProgress");
  const plotList = $("#plotList");

  const projectModal = $("#projectModal");
  const modalTitle = $("#modalTitle");
  const modalCloseBtn = $("#modalCloseBtn");
  const projectForm = $("#projectForm");
  const cancelFormBtn = $("#cancelFormBtn");

  const plotModal = $("#plotModal");
  const plotModalTitle = $("#plotModalTitle");
  const plotModalCloseBtn = $("#plotModalCloseBtn");
  const plotForm = $("#plotForm");
  const cancelPlotBtn = $("#cancelPlotBtn");

  const confirmModal = $("#confirmModal");
  const confirmMessage = $("#confirmMessage");
  const confirmCancelBtn = $("#confirmCancelBtn");
  const confirmOkBtn = $("#confirmOkBtn");

  const dataMenuBtn = $("#dataMenuBtn");
  const dataMenu = $("#dataMenu");
  const exportBtn = $("#exportBtn");
  const importBtn = $("#importBtn");
  const importFileInput = $("#importFileInput");

  const shareModal = $("#shareModal");
  const shareModalCloseBtn = $("#shareModalCloseBtn");
  const shareUrlSection = $("#shareUrlSection");
  const shareUrlInput = $("#shareUrlInput");
  const copyShareUrlBtn = $("#copyShareUrlBtn");
  const shareUrlSize = $("#shareUrlSize");
  const generateShareUrlBtn = $("#generateShareUrlBtn");
  const closeShareModalBtn = $("#closeShareModalBtn");
  const shareUrlBtn = $("#shareUrlBtn");

  const restoreModal = $("#restoreModal");
  const restoreCancelBtn = $("#restoreCancelBtn");
  const restoreOkBtn = $("#restoreOkBtn");

  const mascotSection = $("#mascotSection");
  const mascotIcon = $("#mascotIcon");
  const mascotName = $("#mascotName");
  const mascotMessage = $("#mascotMessage");
  const mascotRefresh = $("#mascotRefresh");
  const mascotSelector = $("#mascotSelector");

  // ---- Helpers ----
  function getProject(id) {
    return projects.find((p) => p.id === id);
  }

  function persist() {
    saveProjects(projects);
  }

  function getModeLabel(mode) {
    switch (mode) {
      case "wordcount": return "文字数ベース";
      case "plot": return "プロットベース";
      case "both": return "文字数 + プロット";
      default: return mode;
    }
  }

  function calcPlotProgress(project) {
    if (!project.plots || project.plots.length === 0) return 0;
    const done = project.plots.filter((p) => p.completed).length;
    return Math.round((done / project.plots.length) * 100);
  }

  function calcWordProgress(project) {
    if (!project.targetWordCount || project.targetWordCount <= 0) return null;
    const pct = Math.min(100, Math.round((project.currentWordCount / project.targetWordCount) * 100));
    return pct;
  }

  function calcOverallProgress(project) {
    const mode = project.progressMode;
    if (mode === "wordcount") {
      return calcWordProgress(project);
    } else if (mode === "plot") {
      return calcPlotProgress(project);
    } else {
      const wp = calcWordProgress(project);
      const pp = calcPlotProgress(project);
      if (wp == null) return pp;
      return Math.round((wp + pp) / 2);
    }
  }

  // ---- Mascot ----
  function pickRandomMessage(charId) {
    const msgs = CHARACTERS[charId].messages;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  function renderMascot() {
    const char = CHARACTERS[selectedCharacter];
    if (!char) return;

    mascotIcon.innerHTML = char.icon;
    mascotName.textContent = char.name;
    mascotMessage.textContent = pickRandomMessage(selectedCharacter);

    // Render selector
    mascotSelector.innerHTML = CHARACTER_ORDER.map((id) => {
      const c = CHARACTERS[id];
      const activeClass = id === selectedCharacter ? "active" : "";
      return `
        <button class="mascot-selector-btn ${activeClass}" data-char-id="${id}" title="${c.name}">
          ${c.icon}
          <span class="mascot-selector-btn-label">${c.name}</span>
        </button>
      `;
    }).join("");

    mascotSelector.querySelectorAll(".mascot-selector-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedCharacter = btn.dataset.charId;
        saveCharacter(selectedCharacter);
        renderMascot();
      });
    });
  }

  // ---- Rendering: Project List ----
  function renderProjectList() {
    if (projects.length === 0) {
      emptyState.style.display = "";
      projectGrid.style.display = "none";
      return;
    }
    emptyState.style.display = "none";
    projectGrid.style.display = "";

    projectGrid.innerHTML = projects
      .map((p) => {
        const progress = calcOverallProgress(p);
        const days = daysUntil(p.deadline);
        let deadlineClass = "deadline";
        if (days !== null && days < 0) deadlineClass += " overdue";

        let deadlineTag = "";
        if (p.deadline) {
          const label = days === null ? "" : days < 0 ? `(${Math.abs(days)}日超過)` : days === 0 ? "(今日)" : `(残り${days}日)`;
          deadlineTag = `<span class="meta-tag ${deadlineClass}">${formatDate(p.deadline)} ${label}</span>`;
        }

        let wordTag = "";
        if (p.targetWordCount) {
          wordTag = `<span class="meta-tag">${formatNumber(p.currentWordCount)} / ${formatNumber(p.targetWordCount)}字</span>`;
        }

        const progressPct = progress != null ? progress : 0;
        const fillClass = progressPct >= 100 ? "complete" : "";

        return `
          <div class="project-card" data-id="${p.id}">
            <div class="project-card-title">${escapeHtml(p.title)}</div>
            ${p.description ? `<div class="project-card-desc">${escapeHtml(p.description)}</div>` : ""}
            <div class="project-card-meta">
              <span class="meta-tag mode">${getModeLabel(p.progressMode)}</span>
              ${deadlineTag}
              ${wordTag}
            </div>
            <div class="project-card-progress">
              <div class="progress-mini-label">
                <span>進捗</span>
                <span>${progress != null ? progress + "%" : "---"}</span>
              </div>
              <div class="progress-bar progress-bar-mini">
                <div class="progress-fill ${fillClass}" style="width:${progressPct}%"></div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    projectGrid.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("click", () => {
        openProjectDetail(card.dataset.id);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Rendering: Project Detail ----
  function openProjectDetail(id) {
    currentProjectId = id;
    projectListView.style.display = "none";
    projectDetailView.style.display = "";
    newProjectBtn.style.display = "none";
    renderProjectDetail();
  }

  function closeProjectDetail() {
    currentProjectId = null;
    projectDetailView.style.display = "none";
    projectListView.style.display = "";
    newProjectBtn.style.display = "";
    renderProjectList();
  }

  function renderProjectDetail() {
    const p = getProject(currentProjectId);
    if (!p) {
      closeProjectDetail();
      return;
    }

    // Detail info
    const days = daysUntil(p.deadline);
    let deadlineHtml = "";
    if (p.deadline) {
      let dayLabel = "";
      if (days < 0) dayLabel = `<span style="color:var(--color-danger)">(${Math.abs(days)}日超過)</span>`;
      else if (days === 0) dayLabel = `<span style="color:var(--color-accent)">(今日)</span>`;
      else dayLabel = `(残り${days}日)`;
      deadlineHtml = `
        <div class="detail-meta-item">
          <strong>締め切り:</strong> ${formatDate(p.deadline)} ${dayLabel}
        </div>`;
    }

    let targetHtml = "";
    if (p.targetWordCount) {
      targetHtml = `
        <div class="detail-meta-item">
          <strong>目標文字数:</strong> ${formatNumber(p.targetWordCount)}字
        </div>`;
    }

    detailInfo.innerHTML = `
      <div class="detail-title">${escapeHtml(p.title)}</div>
      ${p.description ? `<div class="detail-description">${escapeHtml(p.description)}</div>` : ""}
      <div class="detail-meta">
        <div class="detail-meta-item">
          <strong>モード:</strong> ${getModeLabel(p.progressMode)}
        </div>
        ${deadlineHtml}
        ${targetHtml}
        <div class="detail-meta-item">
          <strong>作成日:</strong> ${formatDate(p.createdAt)}
        </div>
      </div>
    `;

    // Word Count Section
    if (p.progressMode === "wordcount" || p.progressMode === "both") {
      wordCountSection.style.display = "";
      currentWordCountInput.value = p.currentWordCount || 0;
      renderWordCountProgress(p);
      renderWordCountHistory(p);
    } else {
      wordCountSection.style.display = "none";
    }

    // Plot Section
    if (p.progressMode === "plot" || p.progressMode === "both") {
      plotSection.style.display = "";
      renderPlotProgress(p);
      renderPlotList(p);
    } else {
      plotSection.style.display = "none";
    }

    // Timeline
    renderTimeline(p);
  }

  function renderWordCountProgress(p) {
    const pct = calcWordProgress(p);
    if (pct != null) {
      const fillClass = pct >= 100 ? "complete" : "";
      wordCountProgress.innerHTML = `
        <div class="progress-label">
          <span>${formatNumber(p.currentWordCount)} / ${formatNumber(p.targetWordCount)}字</span>
          <span>${pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
        </div>
      `;
    } else {
      wordCountProgress.innerHTML = `
        <div class="progress-label">
          <span>現在: ${formatNumber(p.currentWordCount)}字</span>
          <span>目標未設定</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:0%"></div>
        </div>
      `;
    }
  }

  function renderWordCountHistory(p) {
    if (!p.wordCountHistory || p.wordCountHistory.length === 0) {
      wordCountHistory.innerHTML = `
        <div class="wordcount-history-title">更新履歴</div>
        <p style="font-size:0.85rem;color:var(--color-text-muted);">まだ履歴がありません</p>
      `;
      return;
    }

    // Chart
    const chartHtml = renderMiniChart(p);

    const items = [...p.wordCountHistory].reverse().map((entry, i, arr) => {
      const prev = arr[i + 1];
      let diffHtml = "";
      if (prev) {
        const diff = entry.count - prev.count;
        if (diff > 0) {
          diffHtml = `<span class="history-diff positive">+${formatNumber(diff)}</span>`;
        } else if (diff < 0) {
          diffHtml = `<span class="history-diff negative">${formatNumber(diff)}</span>`;
        }
      }
      return `
        <li class="history-item">
          <span class="history-date">${formatDate(entry.date)}</span>
          <span>
            <span class="history-count">${formatNumber(entry.count)}字</span>
            ${diffHtml}
          </span>
        </li>
      `;
    });

    wordCountHistory.innerHTML = `
      <div class="wordcount-history-title">更新履歴</div>
      ${chartHtml}
      <ul class="history-list">${items.join("")}</ul>
    `;
  }

  function renderMiniChart(p) {
    if (!p.wordCountHistory || p.wordCountHistory.length < 2) return "";

    const data = p.wordCountHistory.slice(-20);
    const maxVal = Math.max(...data.map((d) => d.count), p.targetWordCount || 0) || 1;
    const width = 100;
    const height = 100;
    const padding = 5;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = padding + chartH - (d.count / maxVal) * chartH;
      return `${x},${y}`;
    });

    const polyline = points.join(" ");

    // Area fill
    const areaPoints = `${padding},${padding + chartH} ${polyline} ${padding + chartW},${padding + chartH}`;

    // Target line
    let targetLine = "";
    if (p.targetWordCount) {
      const ty = padding + chartH - (p.targetWordCount / maxVal) * chartH;
      targetLine = `<line x1="${padding}" y1="${ty}" x2="${padding + chartW}" y2="${ty}" stroke="var(--color-accent)" stroke-width="0.5" stroke-dasharray="2,2"/>`;
    }

    return `
      <div class="chart-container">
        <svg class="chart-canvas" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          <polygon points="${areaPoints}" fill="var(--color-primary-light)" opacity="0.5"/>
          <polyline points="${polyline}" fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
          ${targetLine}
        </svg>
      </div>
    `;
  }

  function renderPlotProgress(p) {
    const total = p.plots ? p.plots.length : 0;
    const done = p.plots ? p.plots.filter((pl) => pl.completed).length : 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const fillClass = pct >= 100 ? "complete" : "";

    plotProgress.innerHTML = `
      <div class="progress-label">
        <span>${done} / ${total} 項目完了</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
      </div>
    `;
  }

  function renderPlotList(p) {
    if (!p.plots || p.plots.length === 0) {
      plotList.innerHTML = `<p style="font-size:0.85rem;color:var(--color-text-muted);">プロット項目がまだありません</p>`;
      return;
    }

    plotList.innerHTML = p.plots
      .sort((a, b) => a.order - b.order)
      .map((pl, idx) => {
        const checkedClass = pl.completed ? "checked" : "";
        const itemClass = pl.completed ? "completed" : "";
        return `
          <div class="plot-item ${itemClass}" data-plot-id="${pl.id}" draggable="true">
            <span class="drag-handle" title="ドラッグで並び替え">⠿</span>
            <span class="plot-order">${idx + 1}</span>
            <div class="plot-checkbox ${checkedClass}" data-plot-id="${pl.id}"></div>
            <div class="plot-content">
              <div class="plot-item-title">${escapeHtml(pl.title)}</div>
              ${pl.description ? `<div class="plot-item-desc">${escapeHtml(pl.description)}</div>` : ""}
            </div>
            <div class="plot-item-actions">
              <button class="btn btn-sm btn-secondary plot-edit-btn" data-plot-id="${pl.id}">編集</button>
              <button class="btn btn-sm btn-danger plot-delete-btn" data-plot-id="${pl.id}">削除</button>
            </div>
          </div>
        `;
      })
      .join("");

    // Checkbox events
    plotList.querySelectorAll(".plot-checkbox").forEach((cb) => {
      cb.addEventListener("click", () => {
        togglePlotComplete(cb.dataset.plotId);
      });
    });

    // Edit events
    plotList.querySelectorAll(".plot-edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditPlot(btn.dataset.plotId);
      });
    });

    // Delete events
    plotList.querySelectorAll(".plot-delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deletePlotItem(btn.dataset.plotId);
      });
    });

    // Drag and drop for reordering
    setupDragAndDrop();
  }

  // ---- Timeline ----
  function renderTimeline(p) {
    const timelineSection = $("#timelineSection");
    if (!timelineSection) return;

    // Build timeline events from multiple sources
    const events = [];

    // Project creation
    events.push({
      date: p.createdAt.slice(0, 10),
      type: "start",
      label: "プロジェクト開始",
      detail: "",
    });

    // Word count history entries
    if (p.wordCountHistory) {
      for (let i = 0; i < p.wordCountHistory.length; i++) {
        const entry = p.wordCountHistory[i];
        const prev = i > 0 ? p.wordCountHistory[i - 1] : null;
        const diff = prev ? entry.count - prev.count : entry.count;
        const pct = p.targetWordCount ? Math.min(100, Math.round((entry.count / p.targetWordCount) * 100)) : null;
        events.push({
          date: entry.date,
          type: "wordcount",
          label: formatNumber(entry.count) + "字",
          diff: diff,
          pct: pct,
        });
      }
    }

    // Plot completion events
    if (p.plots) {
      p.plots.forEach((pl) => {
        if (pl.completed && pl.completedAt) {
          events.push({
            date: pl.completedAt.slice(0, 10),
            type: "plot",
            label: "プロット完了",
            detail: pl.title,
          });
        }
      });
    }

    // Deadline / goal
    if (p.deadline) {
      events.push({
        date: p.deadline,
        type: "goal",
        label: "締め切り・目標日",
        detail: "",
      });
    }

    // Sort by date
    events.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      // start first, goal last
      const order = { start: 0, wordcount: 1, plot: 1, goal: 2 };
      return (order[a.type] || 1) - (order[b.type] || 1);
    });

    if (events.length <= 1) {
      timelineSection.innerHTML = `
        <div class="timeline-section-title">タイムライン</div>
        <p class="timeline-empty">進捗データを記録すると、ここにタイムラインが表示されます</p>
      `;
      return;
    }

    const today = todayISO();

    const itemsHtml = events.map((ev) => {
      let dotClass = "";
      let contentHtml = "";

      if (ev.type === "start") {
        dotClass = "active";
        contentHtml = `<div class="timeline-start">開始</div>`;
      } else if (ev.type === "goal") {
        dotClass = "milestone";
        contentHtml = `<div class="timeline-goal">🏁 ${escapeHtml(ev.label)}</div>`;
      } else if (ev.type === "wordcount") {
        dotClass = ev.pct != null && ev.pct >= 100 ? "complete" : "active";
        let diffHtml = "";
        if (ev.diff > 0) {
          diffHtml = `<span class="tl-diff positive">+${formatNumber(ev.diff)}</span>`;
        } else if (ev.diff < 0) {
          diffHtml = `<span class="tl-diff negative">${formatNumber(ev.diff)}</span>`;
        }
        let barHtml = "";
        if (ev.pct != null) {
          const fillCls = ev.pct >= 100 ? "complete" : "";
          barHtml = `<div class="timeline-progress-bar"><div class="timeline-progress-fill ${fillCls}" style="width:${ev.pct}%"></div></div>`;
        }
        contentHtml = `<div class="timeline-content"><span class="tl-label">文字数:</span> <span class="tl-value">${ev.label}</span>${diffHtml}${barHtml}</div>`;
      } else if (ev.type === "plot") {
        dotClass = "complete";
        contentHtml = `<div class="timeline-content"><span class="tl-label">✓</span> <span class="tl-value">${escapeHtml(ev.detail)}</span></div>`;
      }

      return `
        <div class="timeline-item">
          <div class="timeline-dot ${dotClass}"></div>
          <div class="timeline-date">${formatDate(ev.date)}${ev.date === today ? " (今日)" : ""}</div>
          ${contentHtml}
        </div>
      `;
    }).join("");

    timelineSection.innerHTML = `
      <div class="timeline-section-title">タイムライン</div>
      <div class="timeline-container">
        <div class="timeline-line"></div>
        ${itemsHtml}
      </div>
    `;
  }

  // ---- Drag and Drop ----
  let draggedEl = null;

  function setupDragAndDrop() {
    const items = plotList.querySelectorAll(".plot-item");
    items.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        draggedEl = item;
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        items.forEach((i) => i.classList.remove("drag-over"));
        draggedEl = null;
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedEl && draggedEl !== item) {
          item.classList.add("drag-over");
        }
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");
        if (!draggedEl || draggedEl === item) return;

        const p = getProject(currentProjectId);
        if (!p) return;

        const fromId = draggedEl.dataset.plotId;
        const toId = item.dataset.plotId;
        const fromIdx = p.plots.findIndex((pl) => pl.id === fromId);
        const toIdx = p.plots.findIndex((pl) => pl.id === toId);

        if (fromIdx === -1 || toIdx === -1) return;

        const [moved] = p.plots.splice(fromIdx, 1);
        p.plots.splice(toIdx, 0, moved);

        // Update order values
        p.plots.forEach((pl, i) => {
          pl.order = i;
        });

        p.updatedAt = new Date().toISOString();
        persist();
        renderPlotList(p);
        renderPlotProgress(p);
      });
    });
  }

  // ---- Actions: Project CRUD ----
  function openNewProjectModal() {
    editingProjectId = null;
    modalTitle.textContent = "新規プロジェクト";
    projectForm.reset();
    // Default to 'both'
    document.querySelector('input[name="progressMode"][value="both"]').checked = true;
    projectModal.style.display = "";
  }

  function openEditProjectModal(id) {
    const p = getProject(id);
    if (!p) return;
    editingProjectId = id;
    modalTitle.textContent = "プロジェクトを編集";
    $("#projectTitle").value = p.title;
    $("#projectDescription").value = p.description || "";
    $("#projectDeadline").value = p.deadline || "";
    $("#projectTargetWordCount").value = p.targetWordCount || "";
    const radio = document.querySelector(`input[name="progressMode"][value="${p.progressMode}"]`);
    if (radio) radio.checked = true;
    projectModal.style.display = "";
  }

  function closeProjectModal() {
    projectModal.style.display = "none";
    editingProjectId = null;
  }

  function saveProject(e) {
    e.preventDefault();

    const title = $("#projectTitle").value.trim();
    const description = $("#projectDescription").value.trim();
    const deadline = $("#projectDeadline").value || null;
    const targetWordCountRaw = $("#projectTargetWordCount").value;
    const targetWordCount = targetWordCountRaw ? parseInt(targetWordCountRaw, 10) : null;
    const progressMode = document.querySelector('input[name="progressMode"]:checked').value;

    if (!title) return;

    if (editingProjectId) {
      // Edit existing
      const p = getProject(editingProjectId);
      if (!p) return;
      p.title = title;
      p.description = description;
      p.deadline = deadline;
      p.targetWordCount = targetWordCount;
      p.progressMode = progressMode;
      p.updatedAt = new Date().toISOString();
    } else {
      // New project
      const newProject = {
        id: generateId(),
        title,
        description,
        deadline,
        targetWordCount,
        currentWordCount: 0,
        progressMode,
        plots: [],
        wordCountHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      projects.push(newProject);
    }

    persist();
    closeProjectModal();

    if (currentProjectId) {
      renderProjectDetail();
    } else {
      renderProjectList();
    }
  }

  function deleteProject() {
    showConfirm("このプロジェクトを削除しますか？この操作は取り消せません。", () => {
      projects = projects.filter((p) => p.id !== currentProjectId);
      persist();
      closeProjectDetail();
    });
  }

  // ---- Actions: Word Count ----
  function updateWordCount() {
    const p = getProject(currentProjectId);
    if (!p) return;

    const val = parseInt(currentWordCountInput.value, 10);
    if (isNaN(val) || val < 0) return;

    p.currentWordCount = val;

    // Add to history (merge if same day)
    const today = todayISO();
    const existing = p.wordCountHistory.find((h) => h.date === today);
    if (existing) {
      existing.count = val;
    } else {
      p.wordCountHistory.push({ date: today, count: val });
    }

    p.updatedAt = new Date().toISOString();
    persist();
    renderWordCountProgress(p);
    renderWordCountHistory(p);
  }

  // ---- Actions: Plot Items ----
  function openAddPlotModal() {
    editingPlotId = null;
    plotModalTitle.textContent = "プロット項目を追加";
    plotForm.reset();
    plotModal.style.display = "";
  }

  function openEditPlot(plotId) {
    const p = getProject(currentProjectId);
    if (!p) return;
    const plot = p.plots.find((pl) => pl.id === plotId);
    if (!plot) return;

    editingPlotId = plotId;
    plotModalTitle.textContent = "プロット項目を編集";
    $("#plotTitle").value = plot.title;
    $("#plotDescription").value = plot.description || "";
    plotModal.style.display = "";
  }

  function closePlotModal() {
    plotModal.style.display = "none";
    editingPlotId = null;
  }

  function savePlotItem(e) {
    e.preventDefault();

    const p = getProject(currentProjectId);
    if (!p) return;

    const title = $("#plotTitle").value.trim();
    const description = $("#plotDescription").value.trim();

    if (!title) return;

    if (editingPlotId) {
      const plot = p.plots.find((pl) => pl.id === editingPlotId);
      if (!plot) return;
      plot.title = title;
      plot.description = description;
    } else {
      const maxOrder = p.plots.length > 0 ? Math.max(...p.plots.map((pl) => pl.order)) : -1;
      p.plots.push({
        id: generateId(),
        title,
        description,
        order: maxOrder + 1,
        completed: false,
      });
    }

    p.updatedAt = new Date().toISOString();
    persist();
    closePlotModal();
    renderPlotProgress(p);
    renderPlotList(p);
  }

  function togglePlotComplete(plotId) {
    const p = getProject(currentProjectId);
    if (!p) return;
    const plot = p.plots.find((pl) => pl.id === plotId);
    if (!plot) return;

    plot.completed = !plot.completed;
    plot.completedAt = plot.completed ? new Date().toISOString() : null;
    p.updatedAt = new Date().toISOString();
    persist();
    renderPlotProgress(p);
    renderPlotList(p);
  }

  function deletePlotItem(plotId) {
    showConfirm("このプロット項目を削除しますか？", () => {
      const p = getProject(currentProjectId);
      if (!p) return;
      p.plots = p.plots.filter((pl) => pl.id !== plotId);
      p.plots.forEach((pl, i) => { pl.order = i; });
      p.updatedAt = new Date().toISOString();
      persist();
      renderPlotProgress(p);
      renderPlotList(p);
    });
  }

  // ---- URL Share ----
  function compressData(data) {
    const json = JSON.stringify(data);
    // Use encodeURIComponent + btoa for broad compatibility
    try {
      return btoa(unescape(encodeURIComponent(json)));
    } catch {
      return null;
    }
  }

  function decompressData(encoded) {
    try {
      const json = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function generateShareUrl() {
    const data = {
      v: 1,
      c: selectedCharacter,
      p: projects,
    };
    const encoded = compressData(data);
    if (!encoded) {
      alert("データの圧縮に失敗しました。");
      return null;
    }
    return window.location.origin + window.location.pathname + "#share=" + encoded;
  }

  function checkUrlForSharedData() {
    const hash = window.location.hash;
    if (!hash.startsWith("#share=")) return;
    const encoded = hash.slice(7);
    const data = decompressData(encoded);
    if (!data || !data.p || !Array.isArray(data.p)) {
      alert("共有URLのデータが無効です。");
      window.location.hash = "";
      return;
    }
    pendingRestore = data;
    const restoreInfo = $("#restoreInfo");
    restoreInfo.textContent = data.p.length + " 件のプロジェクトが含まれています";
    restoreModal.style.display = "";
  }

  let pendingRestore = null;

  // ---- Data Export / Import ----
  function exportData() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      character: selectedCharacter,
      projects: projects,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "novel-progress-" + todayISO() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.projects || !Array.isArray(data.projects)) {
          alert("無効なファイル形式です。エクスポートしたJSONファイルを選択してください。");
          return;
        }

        showConfirm(
          "現在のデータをすべて上書きしてインポートしますか？（元に戻せません）",
          () => {
            projects = data.projects;
            persist();

            if (data.character && CHARACTERS[data.character]) {
              selectedCharacter = data.character;
              saveCharacter(selectedCharacter);
            }

            if (currentProjectId) {
              closeProjectDetail();
            } else {
              renderProjectList();
            }
            renderMascot();
            alert("インポートが完了しました。（" + projects.length + "件のプロジェクト）");
          }
        );
      } catch {
        alert("ファイルの読み込みに失敗しました。正しいJSONファイルか確認してください。");
      }
    };
    reader.readAsText(file);
  }

  // ---- Confirm Dialog ----
  function showConfirm(message, onOk) {
    confirmMessage.textContent = message;
    confirmCallback = onOk;
    confirmModal.style.display = "";
  }

  function closeConfirm() {
    confirmModal.style.display = "none";
    confirmCallback = null;
  }

  // ---- Event Bindings ----
  headerTitle.addEventListener("click", () => {
    if (currentProjectId) closeProjectDetail();
  });

  newProjectBtn.addEventListener("click", openNewProjectModal);
  backBtn.addEventListener("click", closeProjectDetail);
  editProjectBtn.addEventListener("click", () => openEditProjectModal(currentProjectId));
  deleteProjectBtn.addEventListener("click", deleteProject);

  modalCloseBtn.addEventListener("click", closeProjectModal);
  cancelFormBtn.addEventListener("click", closeProjectModal);
  projectForm.addEventListener("submit", saveProject);

  updateWordCountBtn.addEventListener("click", updateWordCount);

  addPlotBtn.addEventListener("click", openAddPlotModal);
  plotModalCloseBtn.addEventListener("click", closePlotModal);
  cancelPlotBtn.addEventListener("click", closePlotModal);
  plotForm.addEventListener("submit", savePlotItem);

  // Data menu
  dataMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dataMenu.style.display = dataMenu.style.display === "none" ? "" : "none";
  });

  document.addEventListener("click", () => {
    dataMenu.style.display = "none";
  });

  dataMenu.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  exportBtn.addEventListener("click", () => {
    dataMenu.style.display = "none";
    exportData();
  });

  importBtn.addEventListener("click", () => {
    dataMenu.style.display = "none";
    importFileInput.click();
  });

  importFileInput.addEventListener("change", () => {
    if (importFileInput.files.length > 0) {
      importData(importFileInput.files[0]);
      importFileInput.value = "";
    }
  });

  // URL Share events
  shareUrlBtn.addEventListener("click", () => {
    dataMenu.style.display = "none";
    shareUrlSection.style.display = "none";
    shareModal.style.display = "";
  });

  shareModalCloseBtn.addEventListener("click", () => {
    shareModal.style.display = "none";
  });

  closeShareModalBtn.addEventListener("click", () => {
    shareModal.style.display = "none";
  });

  generateShareUrlBtn.addEventListener("click", () => {
    const url = generateShareUrl();
    if (!url) return;
    shareUrlInput.value = url;
    shareUrlSection.style.display = "";
    const sizeKB = (new Blob([url]).size / 1024).toFixed(1);
    shareUrlSize.textContent = "URL長: 約" + sizeKB + "KB";
    if (url.length > 8000) {
      shareUrlSize.textContent += "（URLが長いため、一部ブラウザやサービスで共有できない場合があります）";
      shareUrlSize.className = "share-url-size warning";
    } else {
      shareUrlSize.className = "share-url-size";
    }
  });

  copyShareUrlBtn.addEventListener("click", () => {
    shareUrlInput.select();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrlInput.value).then(() => {
        copyShareUrlBtn.textContent = "コピー済み！";
        setTimeout(() => { copyShareUrlBtn.textContent = "コピー"; }, 2000);
      });
    } else {
      document.execCommand("copy");
      copyShareUrlBtn.textContent = "コピー済み！";
      setTimeout(() => { copyShareUrlBtn.textContent = "コピー"; }, 2000);
    }
  });

  // Restore from URL events
  restoreCancelBtn.addEventListener("click", () => {
    restoreModal.style.display = "none";
    pendingRestore = null;
    window.location.hash = "";
  });

  restoreOkBtn.addEventListener("click", () => {
    if (pendingRestore) {
      projects = pendingRestore.p;
      persist();
      if (pendingRestore.c && CHARACTERS[pendingRestore.c]) {
        selectedCharacter = pendingRestore.c;
        saveCharacter(selectedCharacter);
      }
      renderMascot();
      if (currentProjectId) {
        closeProjectDetail();
      } else {
        renderProjectList();
      }
      alert("データを復元しました（" + projects.length + "件のプロジェクト）");
    }
    restoreModal.style.display = "none";
    pendingRestore = null;
    window.location.hash = "";
  });

  mascotRefresh.addEventListener("click", () => {
    mascotMessage.textContent = pickRandomMessage(selectedCharacter);
  });

  confirmCancelBtn.addEventListener("click", closeConfirm);
  confirmOkBtn.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });

  // Close modals on overlay click
  [projectModal, plotModal, confirmModal, shareModal, restoreModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        editingProjectId = null;
        editingPlotId = null;
        confirmCallback = null;
      }
    });
  });

  // Keyboard: Escape to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (confirmModal.style.display !== "none") {
        closeConfirm();
      } else if (plotModal.style.display !== "none") {
        closePlotModal();
      } else if (projectModal.style.display !== "none") {
        closeProjectModal();
      }
    }
  });

  // ---- Init ----
  renderMascot();
  renderProjectList();
  checkUrlForSharedData();
})();
